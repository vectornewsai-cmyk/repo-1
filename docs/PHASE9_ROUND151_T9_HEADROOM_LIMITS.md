# LIMITS — Phase 9 đợt 151, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ năm liên tiếp; headroom 194 → 90 — sâu nhất từ trước tới nay; balloon GHIM TRẦN TRỞ LẠI đợt mới trên boot fad2aab9; reboot #42 giữa phiên; #22 CÓ lượt hợp lệ #19)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 194/194 (02:40:42Z, boot 2e430750) → đóng 90/90 (04:52:32Z, boot fad2aab9)** — giảm −104 trong phiên, qua reboot #42; **dưới ngưỡng < ~1.800 lần thứ mười một liên tiếp**; tỉ lệ/vite **0,123 → 0,057** — **sâu nhất từ trước tới nay** (150: 0,20 lúc đóng; 149: 0,21). Quyết parent (l) đợt 150 "vẫn chỉ theo dõi" đứng — T9 chỉ theo dõi, không báo riêng. Xem §1.
- **Balloon GHIM TRẦN TRỞ LẠI — đợt mới trên boot fad2aab9, 31/134 mẫu, 3 chuỗi (2 + 28 + 1):** chạm trần lần đầu 03:38:18Z (2 mẫu); episode chính **04:09:18–04:36:19Z, 28 mẫu, 27 phút**; chạm lại 1 mẫu lúc đóng 04:52:19Z — **chuỗi còn mở lúc sampler dừng** (khác đợt 150: quan sát được điểm đứt). **Phán theo quy tắc quyết (e): đợt 151 là đợt ghim MỚI** (cách đợt 150 hai reboot #41 + #42, xả sâu tới 3,58M kB, ~2h40m không ghim) — xem §2.2. T10 xác nhận cách đếm trong đợt.
- **RAM:** sampler **134 mẫu, 02:39:29–04:52:19Z, HAI boot** (47 mẫu boot 2e430750 + 87 mẫu boot fad2aab9; gap 46 s tại reboot #42, sampler khởi động lại bằng tay). Min **250.840 kB (245,0 MiB) lúc 03:56:18Z** (trong lúc ghim); max **3.243.888 kB (3.168,6 MiB = 51,56% guard) lúc 03:03:31Z**; mean 1.033.515 kB. Gate A ≥1024 MiB: **46/134 mẫu**. **0/134 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ năm liên tiếp.** Xem §2, §3.
- **B2: 13 spike load1 ≥3,0 — TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN**, tất cả trong 02:39:59–02:51:28Z trên boot 2e430750; **0 spike sau 02:51:28Z (~2h00m yên)**. Đỉnh **11,03 lúc 02:49:07Z** (watcher); sampler load1 max **11,26 lúc 02:49:30Z**. **ffmpeg testsrc2 geq là driver của 8/13 spike** (suite T1-151 + npm test); T4 attempt1 WebKit chỉ đóng góp thiểu số trong spike 02:47:25Z — corroborate verdict "attempt1 nhiễm tải" của T4. Xem §2.5.
- **F-150-T9-8 ĐÃ SỬA (quyết (n) đợt 150): loại `ps` của chính watcher khỏi top snapshot — KIỂM CHỨNG XONG.** Trước sửa: ps tự lọt top-3 ở 23/30 lần chạy thử; sau sửa: **0/30**; trong phiên thật: **0/13 spike** có `ps` trong snapshot (grep `ps -eo` = 0 dòng) — attribution vẫn đủ 13/13 nhờ `top -b -n1` + delta tick. Xem §2.5, §6.
- **Lượt yên #22 (T4): CÓ LƯỢT HỢP LỆ MỚI #19 — attempt2-2e430750, 02:58:32–03:02:25Z, 20/20 + lớp B 5/5 + tickCost median 39,0 ms.** Attempt1 (02:45:21–02:51:00Z) nhiễm tải, retry đúng luật. T9 chỉ đối chiếu bằng dữ kiện sampler độc lập, không phán lại: cửa sổ attempt1 load1 sampler 7,96–11,26 (nhiễm tải thật); cửa sổ attempt2 load1 0,22–1,49, RAM 1,06–2,87M kB (yên). Xem §2.3, §2.4.
- **WFS #57 (T2): chênh 0 — lần thứ 57 liên tiếp** (NEWSTD 978 dòng / 282 file; R7b 1.003 / 299; copies 25 / 17). T9 chỉ trích lại, không tự đếm.
- **Reboot #42 giữa phiên (03:25:16Z, boot 2e430750 → fad2aab9):** sampler + watcher chết theo reboot, T9 khởi động lại bằng tay 03:26:17Z, gap phủ sóng 46 s. **Dấu hiệu đồng hồ: btime boot mới (03:25:16Z) SỚM HƠN 15 s so với mẫu cuối boot cũ (03:25:31Z)** — đồng hồ lùi ≥15 s tại #42 (hoặc btime lệch); T8-151 corroborate btime/epoch 1795145116; boot cũ sống 7.165 s. Xem §5.
- **T5-151 (đối chiếu):** replay boot mới tới tự nhiên và nhanh (01:26:35–01:30:13Z); **cache APT SỐNG 178 .deb — chuỗi 0 .deb 2 lần DỨT**; postboot PASS poll2 02:40:23Z, cờ mới 02:43:12Z; T5 KHÔNG probe lại headroom (số headroom đợt này do T9 đo). Xem §5.2.
- **⚠️ Lệch số RAM đỉnh với T2-151:** T2 §(g) ghi "RAM đỉnh 34,41% guard" — trùng đúng số đỉnh T9 đợt 150; sampler T9 đợt này đo đỉnh **51,56% guard lúc 03:03:31Z**. T9 không phán T2 đo cửa sổ/phương pháp nào — giao T10 đối chiếu với `ram-max72.py` của T2. Xem F-151-T9-7.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round151-t9/k8-headroom.py` (copy y nguyên từ đợt 150 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 151

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 02:40:42Z 20/11 | **194** | 2e430750 (btime 01:25:51Z) | lần đo 1, boot ~1h15' tuổi; RAM trước đo 1.112.600 kB, balloon 5.630.156 kB (không ghim), load1 3,02 |
| 02:40:42Z 20/11 | **194** | 2e430750 | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 1.122.776 kB, balloon 5.630.156 kB, load1 3,18 |
| 04:52:32Z 20/11 | **90** | fad2aab9 (btime 03:25:16Z) | lần đo 3 (đóng phiên, boot mới sau reboot #42); RAM trước đo 725.088 kB, balloon 6.247.216 kB (đang leo lại sau khi ghim đứt, chưa chạm trần), load1 0,77 |
| 04:52:32Z 20/11 | **90** | fad2aab9 | lần đo 4 (chênh **0** so với lần 3); RAM trước đo 700.072 kB, balloon 6.247.216 kB, load1 0,77 |

- Probe dừng ở `i=194` cả hai lần mở đợt, `i=90` cả hai lần đóng phiên, errno=28 — đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau lần 2 và 4).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 194 = **63.553 watch** lúc mở; 63.747 − 90 = **63.657 watch** lúc đóng (**+104 trong phiên**, qua reboot #42 — reboot không nhả watch ngoài cell).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 194 / 1.578 ≈ **0,123** mở đợt; 90 / 1.578 ≈ **0,057** đóng phiên — **sâu nhất từ trước tới nay** (đợt 150: 0,20 lúc đóng; đợt 149: 0,21).
- T5-151 KHÔNG probe lại headroom đợt này (tránh nhiễu T4 đang đo #22 — T5 §1) nên không có số đối chiếu độc lập đợt này; số T9 đứng một mình, nhưng 2 lần đo chênh 0 ở cả mở và đóng + phương pháp không đổi từ đợt 109.
- Lưu ý: RAM trước đo lần 3 (725.088 kB) thấp hơn lần 1 (1.112.600 kB) trong khi headroom giảm 194 → 90. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước) — reboot #42 cũng không khôi phục headroom (194 mở trên boot cũ → 90 đóng trên boot mới).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–150 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **151** | **194 → 90** | **mở 02:40:42Z boot 2e430750 btime 01:25:51Z → đóng 04:52:32Z boot MỚI fad2aab9 btime 03:25:16Z (reboot #42 GIỮA phiên)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU — và reboot không khôi phục.** Từ đỉnh chuỗi 4.438 xuống 90 = **−4.348 (−98,0%)**. Bước giảm đợt này: −114 so với đóng đợt 150 (308 → 194) ở đầu phiên (qua reboot #41); thêm −104 trong phiên, qua reboot #42.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 90, thấp hơn ngưỡng 1.710, lần thứ mười một liên tiếp.** Quyết parent đợt 150 (l): VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động.
- **Mốc mới: tỉ lệ/vite ~0,057 lúc đóng — sâu nhất từ trước tới nay, lần đầu dưới 0,10.** Headroom chỉ còn ~6% nhu cầu một vite đầy đủ (~1.578 watch).
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 02:39Z, lúc đo probe 02:40:42Z và lúc đóng 04:52:32Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức ~63,6k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler 134 mẫu, 02:39:29–04:52:19Z, HAI boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (boot cũ) → trũng sâu lúc ghim trần (boot mới) → chạm trần lại lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **134 mẫu, 02:39:29Z–04:52:19Z 20/11, HAI boot — gap duy nhất 46 s tại reboot #42** (mẫu cuối boot cũ 03:25:31Z → mẫu đầu boot mới 03:26:17Z; sampler + watcher khởi động lại bằng tay — xem §5.1). Tổng quan: **min 250.840 kB (245,0 MiB) lúc 03:56:18Z (trong lúc ghim); max 3.243.888 kB (3.168,6 MiB) lúc 03:03:31Z — 51,56% guard; mean 1.033.515 kB (1.009,3 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 02:39:29–03:03:31Z | 2e430750 | 447.340–3.243.888 kB | RAM cao, dao động mạnh theo tải suite T1 (spike load1 tới 11,26 — xem §2.5); đỉnh phiên 03:03:31Z (balloon min phiên 3.582.292 kB); gate A MỞ 36/47 mẫu |
| 03:04:31–03:25:31Z | 2e430750 | 352.660–2.909.720 kB | RAM rơi dần khi balloon leo lại 3,93M → 5,83M kB; mẫu 03:16:31Z chỉ 352.660 kB (SwapFree tụt 598.412 → 548.244 kB trong 60 s — xem F-151-T9-6) |
| 03:26:17–03:37:18Z | fad2aab9 | 656.332–1.830.756 kB | Sau reboot #42: RAM hồi 1,83M kB rồi rơi dần khi balloon leo 5,02M → 6,41M kB; SwapFree nhảy lên 1.040.532 kB (swap xả theo reboot) rồi tụt về ~718k kB |
| 03:38:18–03:39:18Z | fad2aab9 | 594.748–608.388 kB | **Chạm trần lần đầu (2 mẫu)** — balloon 6.443.824 kB; xả ngay sau đó về 5.788.464 kB (03:40:18Z) |
| 03:40:18–04:08:18Z | fad2aab9 | 250.840–1.299.084 kB | RAM trũng sâu, balloon leo răng cưa 5,79M → 6,43M kB; min phiên 250.840 kB lúc 03:56:18Z (balloon 6.316.932 kB — chưa ghim nhưng RAM thấp nhất); load1 ≤1,70 suốt giai đoạn (yên về tải) |
| 04:09:18–04:36:19Z | fad2aab9 | 547.080–658.900 kB | **Episode ghim chính: 28 mẫu liên tiếp** (xem §2.2); load1 ≤0,63 suốt episode (yên hoàn toàn về tải dù RAM thấp) |
| 04:37:19–04:51:19Z | fad2aab9 | 420.496–1.081.064 kB | Ghim đứt 04:37:19Z (balloon xả về 5.854.000 kB); RAM hồi nhẹ; gate A mở lại 1 mẫu 04:37:19Z (1.081.064 kB) |
| 04:52:19Z | fad2aab9 | 585.776 kB | **Chạm trần lại — mẫu cuối phiên** (balloon 6.443.824 kB); chuỗi còn mở lúc sampler dừng |

- **Gate A ≥1024 MiB: 46/134 mẫu** (36 mẫu boot cũ + 10 mẫu boot mới — 9 mẫu 03:26–03:33Z + 1 mẫu 04:37:19Z); **0 mẫu ≥ guard**; load1 max (sampler) **11,26 lúc 02:49:30Z**; **8/134 mẫu load1 ≥3,0** (tất cả trong 02:40–02:51Z, trùng cụm spike T1 — xem §2.5).
- Swap: SwapFree 591.472 kB (mẫu đầu) → 641.420 kB (mẫu cuối); dao động 548.244–1.040.532 kB — nhảy lên >1.040.532 kB ngay sau reboot #42 (03:26:17Z) rồi tụt dần về ~610–640k kB.
- Đối chiếu T4-151 (poller, cadence ~45 s): RAM các poll trong cửa sổ attempt1 1.108–2.211 MB khớp sampler T9 cùng cửa sổ (1.796–2.731M kB ≈ 1.754–2.667 MB — chênh pha lấy mẫu); poll sau attempt2 RAM ~1,06–2,87M kB khớp sampler T9 02:58–03:02Z. T4 ghi gate0: T4-check-only 7 poll rồi T5 11 poll — sampler T9 corroborate cửa sổ RAM đủ trong cả hai attempt.
- **Lệch số RAM đỉnh với T2-151 (F-151-T9-7):** T2 §(g) ghi "RAM đỉnh 34,41% guard" — trùng đúng số đỉnh T9 đợt 150 (2.164.956 kB); sampler T9 đợt này đo đỉnh **3.243.888 kB = 51,56% guard lúc 03:03:31Z** (boot cũ, ngay sau attempt2 của T4). T9 không phán T2 đo cửa sổ/phương pháp nào — giao T10 đối chiếu `ram-max72.py` / `ram-max.txt` của T2-151.

### 2.2 Balloon virtio — xả sâu đầu phiên, GHIM TRẦN 31/134 mẫu, episode chính 04:09–04:36Z (28 mẫu, 27 phút)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot cũ (2e430750): KHÔNG ghim lần nào (0/47 mẫu).** Balloon 6.119.488 kB lúc mẫu đầu (02:39:29Z), xả sâu tới min phiên **3.582.292 kB lúc 03:03:31Z** (cùng lúc RAM đỉnh phiên), rồi leo răng cưa trở lại tới 5.830.808 kB lúc mẫu cuối boot cũ.
- **Boot mới (fad2aab9): GHIM TRẦN 31/87 mẫu (35,6%), trong 3 chuỗi (đếm theo mẫu liên tiếp):**
  - **Chuỗi 1: 03:38:18–03:39:18Z, 2 mẫu** (chạm trần lần đầu trên boot mới; mẫu sau 03:40:18Z xả về 5.788.464 kB).
  - **Khoảng xả giữa chuỗi 1 và 2: 03:40:18–04:08:18Z (29 mẫu)** — balloon xả sâu tới min 5.417.012 kB lúc 03:57:18Z (84,1% trần), rồi leo lại.
  - **Chuỗi 2 (episode chính): 04:09:18–04:36:19Z, 28 mẫu, 27 phút** (span 1.621 s).
  - **Khoảng xả giữa chuỗi 2 và 3: 04:37:19–04:51:19Z (15 mẫu)** — balloon xả về min 5.362.912 kB lúc 04:41:19Z (83,2% trần), rồi leo lại.
  - **Chuỗi 3: 04:52:19Z, 1 mẫu** (chạm trần lại đúng mẫu cuối phiên — **chuỗi còn mở lúc sampler dừng**, chưa quan sát được điểm đứt).
- **Tổng ghim trần đợt này: 31/134 mẫu (23,1%).** So với đợt 150: 28/97 mẫu trong 4 chuỗi (1 + 1 + 13 + 13), đứt 00:58:37Z (quan sát được điểm kết thúc); đợt 149: 49/125 mẫu trong 2 chuỗi (22 + 27 phút), chuỗi 2 vẫn ghim lúc đóng. **Khác đợt 150: đợt này T9 KHÔNG quan sát được điểm kết thúc của lần chạm cuối (mẫu cuối phiên vẫn ghim) — như đợt 149.**
- **Phán theo quy tắc quyết (e) (T9 phán phần liên-đợt, giao T10 xác nhận cách đếm trong đợt):**
  - **Đợt 151 là đợt ghim MỚI, không nối đợt 150:** giữa lần ghim cuối đợt 150 (đứt 00:58:37Z, boot e9295700) và lần chạm đầu đợt 151 (03:38:18Z, boot fad2aab9) có **HAI reboot (#41 btime 01:25:51Z + #42 btime 03:25:16Z) + balloon xả sâu tới 3.582.292 kB (55,6% trần) + ~2h40m không ghim** (00:58:37Z → 03:38:18Z) — đủ cả ba điều kiện của quyết (e) (reboot + xả sâu + thời gian không ghim). Khoảng mù dữ kiện: 01:19:38Z (sampler T9-150 dừng) → 02:39:29Z (sampler T9-151 bắt đầu) không có sampler T9 nào chạy — nhưng trong khoảng này T5-151 ghi replay + postboot trên boot 2e430750, không ghi ghim; T10 lưu ý khi phán.
  - **Trong đợt 151:** T9 trình bày theo cách đếm của đợt 150 (chuỗi lẻ tách khỏi episode chính): episode chính **04:09:18–04:36:19Z (28 mẫu, 27 phút)**; hai lần chạm lẻ — 03:38–03:39Z (2 mẫu, cách episode chính 30 phút không ghim + xả tới 5,42M kB) và 04:52:19Z (1 mẫu, cách episode chính 15 phút không ghim + xả tới 5,36M kB, còn mở lúc đóng). Việc gọi là 1 episode hay 3 chuỗi là phán của T10 — T9 chỉ đưa dữ kiện đầy đủ + cách đếm tham chiếu đợt 150.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~547–659.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 04:52:19Z: tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 585.776 kB.

### 2.3 Lượt yên WebKit #22 (T4, đợt 151) — CÓ LƯỢT HỢP LỆ MỚI #19 (T4 đã xuất bản LIMITS)

- **T4-151 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND151_T4_WEBKIT_QUIET22_LIMITS.md`) — T9 trích verdict T4 + đối chiếu bằng dữ kiện sampler độc lập, không phán lại.
- **Verdict T4: #22 CÓ LƯỢT HỢP LỆ MỚI #19 — attempt2-2e430750, 02:58:32–03:02:25Z, 20/20 + lớp B 5/5 + tickCost median 39,0 ms ≤60.** Attempt1 (02:45:21–02:51:00Z) nhiễm tải (B1+B2 vi phạm, tickCost median 108,0 ms) và đã retry đúng luật (poller poll lại gate trước attempt kế — F-150-T4-3 ĐÓNG, kiểm chứng live). Ngân sách dùng 2/3 attempt. 0 reboot trong phiên T4 (boot 2e430750). Gate0: T4-check-only 7 poll, T5 11 poll (cờ T5-151 có 02:43:12Z, sửa full UUID 02:48:41Z — T4 poll #8 xác nhận t5flag=PASS).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Cửa sổ attempt1 (02:45:21–02:51:00Z): sampler load1 **7,96 / 9,38 / 11,26 / 7,81 / 3,22** (02:47:30Z–02:51:30Z) — **nhiễm tải thật, corroborate verdict attempt1 của T4**. RAM trong cửa sổ này 1.796.728–2.730.576 kB (gate A MỞ) — RAM đủ nhưng tải nhiễm, đúng như T4 ghi (cửa mở lần 1 vì RAM 2.211 MB + load5 1,97 lúc poll, rồi tải vọt lên trong attempt).
  - Cửa sổ attempt2 (02:58:32–03:02:25Z): sampler load1 **0,22 / 1,49 / 1,40 / 0,81** (02:58:31Z–03:01:31Z) — **yên về tải**; RAM 1.061.536–2.871.952 kB (gate A MỞ) — corroborate lượt hợp lệ #19.
  - Spike 02:47:25Z (§2.5) cho thấy WebKit của chính attempt1 chỉ 30,8% + delta 39 tick/s, trong khi suite T1 (ffmpeg testsrc2 geq, vidstab, mask_anim, keyframes self-test) chiếm phần lớn tải — **nguồn nhiễm là tải song song của T1, không phải bản thân phép đo của T4**.
- **Hệ quả gate (T8-151):** O8 PASS 3/3 SAU lượt yên hợp lệ #19, QUA GATE theo chuẩn đứng quyết (i) — lần đầu sau 3 đợt lệch chuẩn (148/149/150); chuỗi WebKit FULL PASS 8 → 9 (chờ T10 xác nhận độc lập). T9 chỉ trích lại, không phán gate.
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ chờ/attempt của T4 (độc lập, cadence 60 s)

Poller T4 chạy 02:40:46Z–~03:02:25Z trên boot 2e430750 (18 poll: 7 gate0=T4-check-only + 11 gate0=T5).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 02:40:29–02:44:30Z | 2e430750 | 3,10–5,66 (3 mẫu ≥3,0) | 1.172.000–1.805.000 kB — **gate A MỞ** | Poll #1–#7 chờ gate0; tải đã cao do suite T1 bắt đầu (spike 02:39–02:42Z) |
| 02:45:30–02:51:30Z | 2e430750 | 3,22–11,26 (5 mẫu ≥3,0) | 1.796.728–2.730.576 kB — **gate A MỞ** | **Attempt1: nhiễm tải** (T4: B1+B2 vi phạm, median 108,0 ms) — sampler T9 corroborate |
| 02:52:30–02:57:31Z | 2e430750 | 0,51–2,82 (0 mẫu ≥3,0) | 1.695.000–2.632.000 kB — **gate A MỞ** | Tải hạ dần sau attempt1 (load5 5,71 → 2,11 theo T4); poller poll lại gate, chờ cửa mở lần 2 |
| 02:58:31–03:02:31Z | 2e430750 | 0,22–1,49 (0 mẫu ≥3,0) | 1.061.536–2.871.952 kB — **gate A MỞ** | **Attempt2: lượt hợp lệ #19** (T4: 20/20, B 5/5, median 39,0 ms) — sampler T9 corroborate yên |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 13 spike, TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN (toàn bộ trên boot 2e430750; 0 spike sau 02:51:28Z)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-151-T9-1). **13 spike, tất cả trong 02:39:59–02:51:28Z trên boot 2e430750; 0 spike trong 02:51:28Z–04:52:19Z (~2h00m yên, gồm toàn bộ lúc balloon ghim trần).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T1 verify: tsc + vidstab + mask_anim (5 spike) | 02:39:59–02:42:49Z | 4,29 / 3,77 / 5,45 / 6,32 / 4,32 | 5 | node tsc --noEmit apps/desktop 128% (spike 1); ffmpeg vidstabdetect red60.mp4 pid 19075 135%, delta **146 tick/s** (spike 2 — max đợt); python3 mask_anim.py 40,8%, delta 27–47 tick/s (spike 3–4); ffmpeg testsrc2 geq mod(X,9) pid 28875 52,3%, delta 85 tick/s (spike 5) | **Suite verify T1-151 (02:39:29–02:51:43Z, 28/28 exit 0)** — spike 2 là ffmpeg `-i round93-u4/.../red60.mp4` (test_round93_u4_failfast, PPID 19064 node render.js) |
| 2 — T1 npm test + T4 attempt1 WebKit (8 spike) | 02:47:25–02:51:28Z | 8,22 / 10,21 / 9,27 / **11,03** / 10,78 / 9,14 / 5,41 / 3,22 | 8 | ffmpeg testsrc2 geq pid 45636/46780/48210/49350/50794/51878/52521 (PPID 44685, 48786) 61,9–127% tức thời; delta tick ghi được 73–114 tick/s (5 spike: 02:47:58Z, 02:49:07Z, 02:49:42Z, 02:50:18Z, 02:50:53Z) — **7/8 spike**; 2 spike 02:48:33Z + 02:51:28Z không ghi được dòng delta của ffmpeg (pid chết trong cửa sổ delta 1 s — `top -b -n1` vẫn bắt được ffmpeg 109% / 127% trong cùng snapshot); WebKitWebProcess pid 39626 (T4 attempt1 MiniBrowser probe121t3-ghost-k7) 30,8%, delta 39 tick/s (spike 02:47:25Z) | **npm test lần chạy trong suite T1 (test_pixelate_render geq + demo effects) + attempt1 của T4** — đỉnh phiên 11,03 = spike 02:49:07Z; sampler load1 max 11,26 lúc 02:49:30Z khớp watcher (pha lấy mẫu) |

- **Sau 02:51:28Z tới 04:52:19Z: 0 spike (~2h00m yên)** — gồm toàn bộ lúc balloon ghim trần (03:38–04:52Z); stack đo (grep/ps mỗi phút) không sinh tải đo được; ghim trần không đi kèm tải.
- **Fix (n) kiểm chứng trong phiên thật: 0/13 snapshot có `ps` của watcher lọt top** (grep `ps -eo` trong b2-spikes.log = 0 dòng). Trước sửa, ps tự lọt top-3 ở 23/30 lần chạy thử; sau sửa 0/30; trong phiên thật 0/13 — **F-150-T9-8 ĐÓNG**. Attribution vẫn đủ 13/13 nhờ dòng top thật + `top -b -n1` + delta tick trong cùng snapshot (vd spike 02:47:25Z: top1 là WebKitWebProcess 30,8%, không còn dòng `ps` 100% che đầu bảng như đợt 150).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. **Kết luận phương pháp (F-147-T9-6 vẫn đóng):** snapshot tức thời + delta tick + nr_running đã quy được 13/13 spike đợt này.
- **Delta tick lớn nhất đợt: 146 tick/s** (pid 19075, ffmpeg vidstabdetect red60.mp4, spike 02:41:04Z); testsrc2 geq 73–114 tick/s (6 spike ghi được — spike 5 + 5 spike cụm 2; 2 spike 02:48:33Z + 02:51:28Z không ghi được delta của ffmpeg, xem trên); mask_anim 27–47 tick/s; tsc spike 1 không ghi được dòng delta (pid chết trước khi vòng delta chạy — xem caveat). (Đợt 150: max 137 tick/s.)
- **testsrc2:** 19 lần nhắc trong b2-spikes.log; **8/13 spike do testsrc2 geq gây ra** (spike 5 + 7–13) — cùng họ test render pixelate geq chạy lại mỗi đợt (như đợt 147–150); mọi PID testsrc2 đều ngắn hạn, thoát bình thường; không process nào kẹt lại. Không mở điều tra thêm (họ F-147/148/149-T9-3 đã ĐÓNG đợt 150).

### 2.6 Truy chủ ffmpeg testsrc2 — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này testsrc2 xuất hiện trong 8/13 spike, tất cả đều là **test render pixelate geq trong suite T1-151** (PPID 44685, 48786 — npm test / test_pixelate_render.js; spike 5 PPID 27226 cùng họ) — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ test render; không process lạ).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ GAP 46 S TẠI REBOOT #42); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ năm liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148/149/150 giữ nguyên): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **3.243.888 kB = 3.168,6 MiB = 51,56% guard lúc 03:03:31Z** — xa guard 3.047.568 kB. Đỉnh này cao hơn đỉnh đợt 150 (2.164.956 kB = 34,41%) nhưng vẫn chưa tới một nửa đường tới guard.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ năm liên tiếp (147, 148, 149, 150, 151).** Cơ chế tự động armed cả phiên (sampler `round151-t9/sampler.sh`, pid 16512 rồi pid 3017 sau reboot #42, chạy 02:39:29–04:52:19Z, 134 mẫu — trừ gap 46 s tại #42, xem §5.1) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→151 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, **3.244**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 02:39:29–04:52:19Z (134 mẫu, chỉ gap 46 s tại reboot #42 rồi khởi động lại bằng tay); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 150 nằm trong dir round150-t9 nên không chặn đợt này (dir mới round151-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-151-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-151-birefnet/out-birefnet-151.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147/148/149/150):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-151-T9-5); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-151-T9-2 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này ở mức nhỏ: reboot #42 giết sampler, gap 46 s** (đợt 149: gap 87 s) — dữ kiện này KHÔNG ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức tuyệt đối, nhưng gap 46 s là nhỏ và T9 khởi động lại bằng tay kịp thời; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10.
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Journal trên boot fad2aab9: 0 dòng "No space left" / ENOSPC** (kiểm tra 04:53Z, `journalctl -b -0 --grep` — "No entries"). Journal chỉ liệt kê **1 boot** (`journalctl --list-boots`: chỉ fad2aab9, first entry 03:25:27Z) — journald không giữ lại journal của boot 2e430750 (volatile), nên **không kiểm được ENOSPC trên boot cũ sau reboot** — ghi rõ giới hạn này (T5/T6 có nguồn khác thì đối chiếu).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=194, i=194, i=90, i=90) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 90 chỉ còn ~0,057 vite — **sâu nhất từ trước tới nay dưới 1 vite đầy đủ**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #42 (giữa phiên) — sampler/watcher chết theo, khởi động lại bằng tay

- **Boot lúc mở đợt 151 = 2e430750-bda0-4a9b-8aab-4dd57661212e** (btime **01:25:51Z** — `uptime -s` 01:25:51 + `/proc/stat` btime 1795137951 KHỚP nhau; T5-151 cũng ghi btime này; đây là **reboot #41, xảy ra TRƯỚC phiên**, trong lúc T10-150 đóng sổ).
- **Reboot #42 GIỮA phiên T9:** sampler cũ (pid 16512) + watcher cũ (pid 16513) chết theo reboot; sleep chờ của T9 bị SIGTERM lúc ~03:25:35Z. Mẫu cuối sampler cũ: **03:25:31Z boot=2e430750 mem=529.500 bal=5.830.808 load1=1,16**. Boot mới **fad2aab9** (btime **03:25:16Z** — `uptime -s` 03:25:16 + `/proc/stat` btime 1795145116 KHỚP nhau; T8-151 corroborate btime/epoch; journal first entry 03:25:27Z). **Sampler + watcher khởi động lại bằng tay lúc 03:26:17Z** (sampler pid 3017, watcher pid 3018; mẫu đầu boot mới 03:26:17Z mem=1.830.756 bal=5.016.120). **Gap phủ sóng sampler: 46 s** (03:25:31Z → 03:26:17Z). B2 watcher: 0 spike nào bị mất chắc chắn trong gap (gap 46 s, watcher cadence 30 s — tối đa 1–2 lần kiểm bị mất; load1 trong gap theo sampler: 1,16 → 2,48, không spike).
- **⚠️ DẤU HIỆU ĐỒNG HỒ TẠI #42 (ghi rõ cho T1/T2/T7): btime boot mới (03:25:16Z) SỚM HƠN 15 s so với mẫu cuối boot cũ (03:25:31Z).** Mẫu cuối boot cũ được ghi bằng `date -u` của sampler ngay trước reboot; btime boot mới (đọc từ `/proc/stat` + `uptime -s`, khớp nhau) lại sớm hơn 15 s. Nghĩa là **đồng hồ lùi ≥15 s tại reboot #42** (hoặc btime có offset so với wall clock) — cùng họ với tranh chấp clock T1–T2 các đợt trước (đã chốt giữ khoảng rộng theo quyết (b) đợt 149). T9 không phán cơ chế đồng hồ — chỉ ghi dữ kiện thô + mốc: sampler cũ chết ~03:25:31–35Z; journal boot mới first entry 03:25:27Z (cũng sớm hơn mẫu cuối boot cũ 4 s). T2/T7 đối chiếu khi gộp mốc reboot #42.
- **Tuổi thọ boot 2e430750:** btime 01:25:51Z → btime boot mới 03:25:16Z = **7.165 s = 1h59m25s** (stat→stat; T8-151 ghi cùng số). T7/T2 đối chiếu mốc neo khi gộp.
- **Không có nghịch lý đồng hồ nào khác trong dữ kiện T9:** mọi timestamp còn lại thứ tự nhất quán. T9 không phán tranh chấp clock T1–T2.
- Các cờ .done lúc T9 đóng (~04:56Z): t0, t1, t2, t4, t5, t6, t8 (7/9 — T7 còn chạy; chỉ còn T9 chưa đóng lúc 04:56Z).

### 5.2 T5-151 — replay + cờ postboot (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- Replay apt trên boot 2e430750 **TỚI TỰ NHIÊN VÀ NHANH** (01:26:35–01:30:13Z, bracket (44 s, 4m22s]) → **postboot PASS poll2 02:40:23Z** → **cờ mới POSTBOOT_PASS 02:43:12Z poll=2** (sửa full UUID 02:48:41Z — T4 poll #8 xác nhận t5flag=PASS). T4 dùng cờ này cho gate0 từ poll #8 (xem §2.3).
- **Cache apt SỐNG 178 .deb / 156M (mtime trước boot) — chuỗi "cache chết 0 .deb" 2 lần DỨT** (quyết (l) đợt 149: chỉ ghi nhận). GST symlink không cần repair. T9 không kết luận về replay (T5 là chủ quản). Hệ quả trực tiếp cho T4: cờ postboot có TRƯỚC khi poller T4 mở (02:40:46Z) nên #22 có lượt hợp lệ đợt này (khác đợt 150: cờ có sau khi poller cắt).
- **Reboot #42 đối với T5:** T5-151 đóng cờ trước #42 (T5 .done đã có lúc T9 kiểm ~04:55Z); replay/postboot trên boot fad2aab9 thuộc cửa T5-152. T9 không phán.

## 6. Sai số của chính T9 (ghi rõ)

- **F-151-T9-1 — Fix (n) ĐÃ SỬA VÀ KIỂM CHỨNG XONG (ĐÓNG F-150-T9-8):** loại `ps` của chính watcher khỏi top snapshot bằng `grep -v 'ps -eo pid,ppid'` (top12) và `grep -v 'ps -eo pid'` (danh sách pid cho delta). Kiểm chứng trước phiên: ps tự lọt top-3 ở **23/30** lần chạy thử chưa lọc vs **0/30** sau lọc. Trong phiên thật: **0/13 spike** có `ps` trong snapshot. Attribution vẫn đủ 13/13 (top thật + `top -b -n1` + delta tick). Sửa nhỏ, ít rủi ro — đúng như quyết (n) dặn; không đổi phương pháp đo khác (cadence, ngưỡng, snapshot giữ nguyên) nên chuỗi so sánh spike giữa các đợt không vỡ.
- **F-151-T9-2 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ năm liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-151-T9-3 — Headroom 194 → 90: dưới ngưỡng lần thứ mười một liên tiếp, tỉ lệ/vite ~0,057 lúc đóng (sâu nhất từ trước tới nay, lần đầu dưới 0,10).** Không phải sai số đo (2 lần đo mở đợt chênh 0, 2 lần đo đóng phiên chênh 0; phương pháp không đổi từ đợt 109). Ghi rõ: quyết "chỉ theo dõi" (l) đợt 150 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động. Trần 63.747 không đổi trong phiên. T5-151 không probe lại headroom nên không có số đối chiếu độc lập đợt này.
- **F-151-T9-4 — T9 KHÔNG phán verdict #22, không phán B4 đúng/sai, không phán cách đếm ghim trong đợt — chỉ đối chiếu dữ kiện:** T4 đã xuất bản LIMITS nên T9 trích verdict T4 (#19 hợp lệ; attempt1 nhiễm tải, retry đúng luật) + bảng sampler độc lập §2.4. T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối). Về balloon: T9 phán đợt 151 là đợt ghim MỚI theo quy tắc (e) (đủ 3 điều kiện liên-đợt — xem §2.2) nhưng giao T10 phán cách đếm trong đợt (1 episode hay 3 chuỗi).
- **F-151-T9-5 — Khoảng trống lấy mẫu 60 giây (cùng lớp F-148/F-149/F-150-T9-5):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Cơ chế tự động chỉ kích hoạt trên mẫu quan sát được — đây là giới hạn thiết kế đã biết, không phải lỗi vận hành. Thêm: **gap 46 s tại reboot #42** là khoảng trống thứ hai (không mẫu nào trong 03:25:31–03:26:17Z) — một lần vượt guard trong gap đó cũng không được quan sát (khả năng thấp: RAM lúc 03:25:31Z chỉ 529.500 kB và lúc 03:26:17Z là 1.830.756 kB, đều xa guard).
- **F-151-T9-6 — Mẫu RAM thấp bất thường 03:16:31Z (boot cũ):** MemAvailable 352.660 kB trong khi mẫu trước (03:15:31Z) 878.972 kB và mẫu sau (03:17:31Z) 1.004.632 kB; cùng mẫu này SwapFree tụt 598.412 → 548.244 kB (giảm ~50 MB trong 60 s) rồi hồi về 566.532 kB mẫu sau. T9 ghi đúng số đo, không loại mẫu, không giải thích cơ chế (có thể là một đợt cấp phát ngắn hạn của luồng khác + swap-out; không có spike load1 kèm theo — load1 mẫu đó 0,35). Mẫu này không ảnh hưởng min phiên (min phiên 250.840 kB lúc 03:56:18Z) hay verdict nào.
- **F-151-T9-7 — ⚠️ Lệch số RAM đỉnh với T2-151 §(g) ("RAM đỉnh 34,41% guard"):** số 34,41% trùng đúng đỉnh sampler T9 đợt 150 (2.164.956 kB); sampler T9 đợt này đo đỉnh **3.243.888 kB = 51,56% guard lúc 03:03:31Z** (boot cũ, ngay sau attempt2 của T4). T9 không phán T2 đo cửa sổ/phương pháp nào (có thể `ram-max72.py` đo cửa sổ mù #72 riêng, hoặc T2 trích số cũ) — giao T10 đối chiếu `ram-max.txt` của T2-151 trước khi chốt số đỉnh đợt này vào aggregate. Số đỉnh của T9 đứng trên dữ kiện sampler gốc (`ram-sampler.log`, 134 mẫu).
- **F-151-T9-8 — Reboot #42 giết sampler/watcher (gap 46 s) + dấu hiệu đồng hồ lùi ≥15 s:** xem §5.1. Gap nhỏ (đợt 149: 87 s) và T9 khởi động lại bằng tay kịp thời; dữ kiện này để parent/T10 xem lại quyết (q) "không cần cơ chế tự hồi phục lúc này" — T9 không đề xuất đổi. Dấu hiệu đồng hồ (btime mới sớm hơn mẫu cuối cũ 15 s) giao T2/T7.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước (copy y nguyên script đợt 150, cap 30.000 thống nhất); file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 152 (phần T9)

1. **Cơ chế tự động (a) armed nhưng chưa có lần kích hoạt thật — lần thứ năm liên tiếp** (0 mẫu ≥ guard đợt này): giữ nguyên sampler + trigger cho đợt 152 (lockfile + log theo phiên mới — lockfile đợt 151 nằm trong dir round151-t9 nên không chặn đợt 152; mỗi đợt dùng dir riêng). Nếu cửa sổ mở lại, cơ chế sẽ bắt trong ≤60 s. Guard giữ nguyên 6.144 MiB; u2net là fallback chính thức. Lần FIRE thật đầu tiên vẫn chưa kiểm chứng end-to-end (F-151-T9-2). **Đỉnh RAM đợt này 51,56% guard — cao nhất kể từ đợt 146 (6.752 MB) nhưng vẫn xa guard.**
2. **⚠️ Headroom 194 → 90 — VẪN DƯỚI < ~1.800, lần thứ mười một liên tiếp dưới ngưỡng** (quyết parent đợt 150 (l): vẫn chỉ theo dõi). **Tỉ lệ/vite ~0,057 lúc đóng — sâu nhất từ trước tới nay, lần đầu dưới 0,10.** Bước giảm −114 so với đóng đợt 150 (qua reboot #41); thêm −104 trong phiên, qua reboot #42. Trần 63.747 không đổi.
3. **Balloon: GHIM TRẦN TRỞ LẠI — đợt mới trên boot fad2aab9 (31/134 mẫu; episode chính 04:09:18–04:36:19Z, 28 mẫu, 27 phút; chạm lẻ 03:38–03:39Z 2 mẫu + 04:52:19Z 1 mẫu còn mở lúc đóng)** sau đợt 150 ghi 28/97 mẫu, đứt 00:58:37Z (quan sát được điểm kết thúc). **Giao T10 xác nhận cách đếm trong đợt** (1 episode hay 3 chuỗi — xem §2.2). Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146.
4. **F-150-T9-8 ĐÃ ĐÓNG (fix (n) kiểm chứng xong):** watcher không còn tự lọt top snapshot (0/13 spike đợt này). Không còn nợ fix watcher.
5. **Lượt yên #22 CÓ lượt hợp lệ mới #19** (attempt2-2e430750, 20/20, B 5/5, median 39,0 ms); O8 PASS 3/3 sau lượt yên hợp lệ, QUA GATE chuẩn (i) lần đầu sau 3 đợt lệch chuẩn; chuỗi WebKit FULL PASS 8 → 9 (chờ T10 xác nhận độc lập). T4-152 đo lượt tiếp theo.
6. **Mù #72? (T2-151) — T9 không có dữ kiện mới; giao T2-152.** Dấu hiệu đồng hồ tại reboot #42 (btime mới sớm hơn mẫu cuối cũ 15 s) giao T2/T7 đối chiếu.
7. **Lệch số RAM đỉnh T9 (51,56%) vs T2-151 §(g) (34,41%) — giao T10 đối chiếu `ram-max.txt` của T2 trước khi chốt số vào aggregate** (F-151-T9-7).
8. Các nợ đứng khác giữ nguyên từ đợt 150 §11 (G1 khung (a) M2 vẫn hoãn chờ user; R9 (a) vẫn chờ user; ci-security.yml vẫn 403 chờ user; file oversize 6,4 MB vẫn chưa quyết; TTS 39 cấm kiểm lại; mẫu (m) đã ĐÓNG theo quyết (d) đợt 149; mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143).

## Phụ lục A — Bảng sampler đầy đủ (134 mẫu: 47 mẫu boot 2e430750 02:39:29–03:25:31Z + 87 mẫu boot fad2aab9 03:26:17–04:52:19Z; gap 46 s tại reboot #42)

(File gốc: `hidden_files/round151-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)

Thống kê: samples: 134; mem min: 250840 kB (245.0 MiB) lúc 03:56:18Z; mem max: 3243888 kB (3168.6 MiB = 51.56% guard) lúc 03:03:31Z; mem mean: 1033515 kB (1009.3 MiB); count >=1024 MiB (gate A): 46/134; count >= guard 6144 MiB: 0/134; balloon frozen 6443824: 31/134 (chuỗi 1: 03:38:18–03:39:18Z n=2; chuỗi 2: 04:09:18–04:36:19Z n=28; chuỗi 3: 04:52:19Z n=1, còn mở lúc đóng); balloon min: 3582292 kB lúc 03:03:31Z; balloon max: 6443824 kB; load1 max (sampler): 11.26 lúc 02:49:30Z; load1 >=3.0 samples: 8/134; reboot gap: 46 s tại reboot #42 (03:25:31Z → 03:26:17Z).

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-20T02:39:29Z | 2e430750 | 447,340 | 436.9 | 7.11% | 6,119,488 | 591,472 | 2.53 |
| 2 | 2026-11-20T02:40:29Z | 2e430750 | 1,171,796 | 1144.3 | 18.63% | 5,581,176 | 628,432 | 3.10 |
| 3 | 2026-11-20T02:41:29Z | 2e430750 | 1,005,524 | 982.0 | 15.98% | 5,722,028 | 632,084 | 4.81 |
| 4 | 2026-11-20T02:42:29Z | 2e430750 | 1,543,208 | 1507.0 | 24.53% | 5,086,112 | 644,496 | 5.66 |
| 5 | 2026-11-20T02:43:29Z | 2e430750 | 1,804,856 | 1762.6 | 28.69% | 4,616,336 | 657,740 | 2.32 |
| 6 | 2026-11-20T02:44:30Z | 2e430750 | 1,688,764 | 1649.2 | 26.84% | 4,769,196 | 659,224 | 0.90 |
| 7 | 2026-11-20T02:45:30Z | 2e430750 | 2,101,248 | 2052.0 | 33.40% | 4,175,376 | 659,124 | 0.45 |
| 8 | 2026-11-20T02:46:30Z | 2e430750 | 1,844,276 | 1801.1 | 29.31% | 3,874,164 | 657,712 | 0.24 |
| 9 | 2026-11-20T02:47:30Z | 2e430750 | 1,796,728 | 1754.6 | 28.56% | 4,060,804 | 651,040 | 7.96 |
| 10 | 2026-11-20T02:48:30Z | 2e430750 | 2,061,180 | 2012.9 | 32.76% | 4,261,944 | 652,388 | 9.38 |
| 11 | 2026-11-20T02:49:30Z | 2e430750 | 1,869,372 | 1825.6 | 29.71% | 4,476,452 | 657,692 | 11.26 |
| 12 | 2026-11-20T02:50:30Z | 2e430750 | 1,760,880 | 1719.6 | 27.99% | 3,827,400 | 643,724 | 7.81 |
| 13 | 2026-11-20T02:51:30Z | 2e430750 | 2,730,576 | 2666.6 | 43.40% | 3,737,000 | 645,020 | 3.22 |
| 14 | 2026-11-20T02:52:30Z | 2e430750 | 2,522,236 | 2463.1 | 40.09% | 4,045,908 | 647,532 | 2.82 |
| 15 | 2026-11-20T02:53:30Z | 2e430750 | 2,639,380 | 2577.5 | 41.95% | 4,040,832 | 639,032 | 1.75 |
| 16 | 2026-11-20T02:54:30Z | 2e430750 | 2,352,828 | 2297.7 | 37.40% | 4,326,392 | 645,000 | 0.96 |
| 17 | 2026-11-20T02:55:30Z | 2e430750 | 2,100,616 | 2051.4 | 33.39% | 4,587,392 | 646,324 | 0.69 |
| 18 | 2026-11-20T02:56:31Z | 2e430750 | 1,886,068 | 1841.9 | 29.98% | 4,825,208 | 650,352 | 1.01 |
| 19 | 2026-11-20T02:57:31Z | 2e430750 | 1,694,220 | 1654.5 | 26.93% | 5,041,036 | 652,212 | 0.51 |
| 20 | 2026-11-20T02:58:31Z | 2e430750 | 1,447,852 | 1413.9 | 23.01% | 5,240,556 | 657,552 | 0.22 |
| 21 | 2026-11-20T02:59:31Z | 2e430750 | 1,061,536 | 1036.7 | 16.87% | 4,826,956 | 609,476 | 1.49 |
| 22 | 2026-11-20T03:00:31Z | 2e430750 | 1,395,444 | 1362.7 | 22.18% | 4,990,404 | 623,092 | 1.40 |
| 23 | 2026-11-20T03:01:31Z | 2e430750 | 1,170,604 | 1143.2 | 18.61% | 5,159,116 | 624,592 | 0.81 |
| 24 | 2026-11-20T03:02:31Z | 2e430750 | 2,871,952 | 2804.6 | 45.65% | 3,958,688 | 614,236 | 0.72 |
| 25 | 2026-11-20T03:03:31Z | 2e430750 | 3,243,888 | 3167.9 | 51.56% | 3,582,292 | 615,112 | 0.30 |
| 26 | 2026-11-20T03:04:31Z | 2e430750 | 2,909,720 | 2841.5 | 46.25% | 3,926,100 | 615,184 | 0.11 |
| 27 | 2026-11-20T03:05:31Z | 2e430750 | 2,598,452 | 2537.6 | 41.30% | 4,237,944 | 615,516 | 0.04 |
| 28 | 2026-11-20T03:06:31Z | 2e430750 | 2,316,984 | 2262.7 | 36.83% | 4,518,604 | 615,740 | 0.13 |
| 29 | 2026-11-20T03:07:31Z | 2e430750 | 2,041,936 | 1994.1 | 32.46% | 4,773,572 | 617,304 | 0.04 |
| 30 | 2026-11-20T03:08:31Z | 2e430750 | 1,782,048 | 1740.3 | 28.32% | 5,003,360 | 617,364 | 0.76 |
| 31 | 2026-11-20T03:09:31Z | 2e430750 | 1,589,096 | 1551.9 | 25.26% | 5,210,344 | 616,076 | 0.55 |
| 32 | 2026-11-20T03:10:31Z | 2e430750 | 1,381,964 | 1349.6 | 21.97% | 5,398,548 | 612,636 | 0.25 |
| 33 | 2026-11-20T03:11:31Z | 2e430750 | 1,241,220 | 1212.1 | 19.73% | 5,568,524 | 609,488 | 0.09 |
| 34 | 2026-11-20T03:12:31Z | 2e430750 | 1,117,140 | 1091.0 | 17.76% | 5,721,864 | 610,068 | 0.09 |
| 35 | 2026-11-20T03:13:31Z | 2e430750 | 935,776 | 913.8 | 14.87% | 5,859,012 | 606,064 | 0.19 |
| 36 | 2026-11-20T03:14:31Z | 2e430750 | 841,416 | 821.7 | 13.37% | 5,985,972 | 603,096 | 0.07 |
| 37 | 2026-11-20T03:15:31Z | 2e430750 | 878,972 | 858.4 | 13.97% | 5,960,176 | 598,412 | 0.14 |
| 38 | 2026-11-20T03:16:31Z | 2e430750 | 352,660 | 344.4 | 5.61% | 6,074,668 | 548,244 | 0.35 |
| 39 | 2026-11-20T03:17:31Z | 2e430750 | 1,004,632 | 981.1 | 15.97% | 5,026,092 | 566,532 | 0.90 |
| 40 | 2026-11-20T03:18:31Z | 2e430750 | 1,583,752 | 1546.6 | 25.17% | 5,179,352 | 577,484 | 0.61 |
| 41 | 2026-11-20T03:19:31Z | 2e430750 | 1,666,552 | 1627.5 | 26.49% | 5,230,624 | 573,532 | 0.41 |
| 42 | 2026-11-20T03:20:31Z | 2e430750 | 1,449,492 | 1415.5 | 23.04% | 5,421,668 | 574,924 | 0.23 |
| 43 | 2026-11-20T03:21:31Z | 2e430750 | 725,560 | 708.6 | 11.53% | 5,470,708 | 576,904 | 1.49 |
| 44 | 2026-11-20T03:22:31Z | 2e430750 | 1,339,208 | 1307.8 | 21.29% | 5,540,080 | 575,852 | 1.60 |
| 45 | 2026-11-20T03:23:31Z | 2e430750 | 556,628 | 543.6 | 8.85% | 5,661,876 | 567,520 | 2.40 |
| 46 | 2026-11-20T03:24:31Z | 2e430750 | 650,904 | 635.6 | 10.35% | 5,743,020 | 565,640 | 1.93 |
| 47 | 2026-11-20T03:25:31Z | 2e430750 | 529,500 | 517.1 | 8.42% | 5,830,808 | 563,620 | 1.16 |
| — | — | — | — | — | — | — | — | — |
| 48 | 2026-11-20T03:26:17Z | fad2aab9 | 1,830,756 | 1787.8 | 29.10% | 5,016,120 | 1,040,532 | 2.48 |
| 49 | 2026-11-20T03:27:17Z | fad2aab9 | 1,643,712 | 1605.2 | 26.13% | 5,225,004 | 1,032,996 | 1.39 |
| 50 | 2026-11-20T03:28:17Z | fad2aab9 | 1,510,252 | 1474.9 | 24.00% | 5,418,052 | 1,020,740 | 0.55 |
| 51 | 2026-11-20T03:29:17Z | fad2aab9 | 1,349,360 | 1317.7 | 21.45% | 5,594,076 | 1,010,412 | 0.20 |
| 52 | 2026-11-20T03:30:17Z | fad2aab9 | 1,142,076 | 1115.3 | 18.15% | 5,755,120 | 1,000,572 | 0.12 |
| 53 | 2026-11-20T03:31:17Z | fad2aab9 | 1,032,352 | 1008.2 | 16.41% | 5,902,432 | 988,608 | 0.09 |
| 54 | 2026-11-20T03:32:17Z | fad2aab9 | 1,177,956 | 1150.3 | 18.72% | 5,840,200 | 790,168 | 1.00 |
| 55 | 2026-11-20T03:33:17Z | fad2aab9 | 1,140,268 | 1113.5 | 18.12% | 5,937,620 | 745,988 | 0.47 |
| 56 | 2026-11-20T03:34:17Z | fad2aab9 | 988,204 | 965.0 | 15.71% | 6,073,788 | 719,488 | 0.22 |
| 57 | 2026-11-20T03:35:17Z | fad2aab9 | 874,580 | 854.1 | 13.90% | 6,196,488 | 717,820 | 0.08 |
| 58 | 2026-11-20T03:36:18Z | fad2aab9 | 755,820 | 738.1 | 12.01% | 6,309,076 | 718,016 | 0.18 |
| 59 | 2026-11-20T03:37:18Z | fad2aab9 | 656,332 | 640.9 | 10.43% | 6,411,264 | 718,572 | 0.17 |
| 60 | 2026-11-20T03:38:18Z | fad2aab9 | 608,388 | 594.1 | 9.67% | 6,443,824 | 717,148 | 0.06 |
| 61 | 2026-11-20T03:39:18Z | fad2aab9 | 594,748 | 580.8 | 9.45% | 6,443,824 | 715,920 | 0.02 |
| 62 | 2026-11-20T03:40:18Z | fad2aab9 | 639,984 | 625.0 | 10.17% | 5,788,464 | 602,228 | 2.36 |
| 63 | 2026-11-20T03:41:18Z | fad2aab9 | 1,299,084 | 1268.6 | 20.65% | 5,786,444 | 614,864 | 2.08 |
| 64 | 2026-11-20T03:42:18Z | fad2aab9 | 560,212 | 547.1 | 8.90% | 5,897,520 | 619,888 | 0.85 |
| 65 | 2026-11-20T03:43:18Z | fad2aab9 | 466,408 | 455.5 | 7.41% | 5,979,720 | 620,220 | 0.41 |
| 66 | 2026-11-20T03:44:18Z | fad2aab9 | 481,832 | 470.5 | 7.66% | 6,064,792 | 621,576 | 0.15 |
| 67 | 2026-11-20T03:45:18Z | fad2aab9 | 414,776 | 405.1 | 6.59% | 6,141,964 | 620,268 | 0.09 |
| 68 | 2026-11-20T03:46:18Z | fad2aab9 | 374,456 | 365.7 | 5.95% | 6,213,484 | 624,884 | 0.03 |
| 69 | 2026-11-20T03:47:18Z | fad2aab9 | 284,556 | 277.9 | 4.52% | 6,276,756 | 621,972 | 0.15 |
| 70 | 2026-11-20T03:48:18Z | fad2aab9 | 642,172 | 627.1 | 10.21% | 5,903,792 | 616,332 | 0.66 |
| 71 | 2026-11-20T03:49:18Z | fad2aab9 | 733,396 | 716.2 | 11.66% | 5,773,400 | 622,756 | 0.51 |
| 72 | 2026-11-20T03:50:18Z | fad2aab9 | 641,304 | 626.3 | 10.19% | 5,875,708 | 621,296 | 0.19 |
| 73 | 2026-11-20T03:51:18Z | fad2aab9 | 538,648 | 526.0 | 8.56% | 5,968,860 | 621,408 | 0.07 |
| 74 | 2026-11-20T03:52:18Z | fad2aab9 | 463,716 | 452.8 | 7.37% | 6,053,536 | 624,344 | 0.06 |
| 75 | 2026-11-20T03:53:18Z | fad2aab9 | 391,652 | 382.5 | 6.23% | 6,130,256 | 623,480 | 0.02 |
| 76 | 2026-11-20T03:54:18Z | fad2aab9 | 332,328 | 324.5 | 5.28% | 6,200,892 | 621,276 | 0.06 |
| 77 | 2026-11-20T03:55:18Z | fad2aab9 | 295,044 | 288.1 | 4.69% | 6,260,768 | 617,156 | 0.31 |
| 78 | 2026-11-20T03:56:18Z | fad2aab9 | 250,840 | 245.0 | 3.99% | 6,316,932 | 619,936 | 0.92 |
| 79 | 2026-11-20T03:57:18Z | fad2aab9 | 901,988 | 880.8 | 14.34% | 5,417,012 | 607,588 | 1.12 |
| 80 | 2026-11-20T03:58:18Z | fad2aab9 | 844,280 | 824.5 | 13.42% | 5,494,876 | 616,504 | 1.25 |
| 81 | 2026-11-20T03:59:18Z | fad2aab9 | 850,424 | 830.5 | 13.52% | 5,608,476 | 617,000 | 0.72 |
| 82 | 2026-11-20T04:00:18Z | fad2aab9 | 778,468 | 760.2 | 12.37% | 5,723,056 | 621,196 | 0.45 |
| 83 | 2026-11-20T04:01:18Z | fad2aab9 | 1,172,212 | 1144.7 | 18.63% | 5,845,460 | 621,556 | 0.21 |
| 84 | 2026-11-20T04:02:18Z | fad2aab9 | 1,030,148 | 1006.0 | 16.37% | 5,985,208 | 622,444 | 0.19 |
| 85 | 2026-11-20T04:03:18Z | fad2aab9 | 901,808 | 880.7 | 14.33% | 6,111,284 | 623,520 | 0.07 |
| 86 | 2026-11-20T04:04:18Z | fad2aab9 | 1,040,600 | 1016.2 | 16.54% | 5,993,004 | 616,432 | 0.68 |
| 87 | 2026-11-20T04:05:18Z | fad2aab9 | 934,068 | 912.2 | 14.85% | 6,112,096 | 608,556 | 0.48 |
| 88 | 2026-11-20T04:06:18Z | fad2aab9 | 812,248 | 793.2 | 12.91% | 6,229,512 | 609,488 | 0.17 |
| 89 | 2026-11-20T04:07:18Z | fad2aab9 | 707,904 | 691.3 | 11.25% | 6,336,008 | 608,332 | 0.06 |
| 90 | 2026-11-20T04:08:18Z | fad2aab9 | 608,124 | 593.9 | 9.67% | 6,431,108 | 609,016 | 0.02 |
| 91 | 2026-11-20T04:09:18Z | fad2aab9 | 598,004 | 584.0 | 9.51% | 6,443,824 | 609,720 | 0.01 |
| 92 | 2026-11-20T04:10:18Z | fad2aab9 | 577,292 | 563.8 | 9.18% | 6,443,824 | 609,868 | 0.00 |
| 93 | 2026-11-20T04:11:18Z | fad2aab9 | 587,704 | 573.9 | 9.34% | 6,443,824 | 609,644 | 0.00 |
| 94 | 2026-11-20T04:12:18Z | fad2aab9 | 593,596 | 579.7 | 9.43% | 6,443,824 | 609,728 | 0.00 |
| 95 | 2026-11-20T04:13:18Z | fad2aab9 | 577,848 | 564.3 | 9.18% | 6,443,824 | 610,028 | 0.04 |
| 96 | 2026-11-20T04:14:18Z | fad2aab9 | 587,788 | 574.0 | 9.34% | 6,443,824 | 610,116 | 0.01 |
| 97 | 2026-11-20T04:15:18Z | fad2aab9 | 592,992 | 579.1 | 9.43% | 6,443,824 | 610,136 | 0.04 |
| 98 | 2026-11-20T04:16:18Z | fad2aab9 | 570,868 | 557.5 | 9.07% | 6,443,824 | 611,604 | 0.01 |
| 99 | 2026-11-20T04:17:18Z | fad2aab9 | 557,740 | 544.7 | 8.87% | 6,443,824 | 611,504 | 0.00 |
| 100 | 2026-11-20T04:18:18Z | fad2aab9 | 547,080 | 534.3 | 8.70% | 6,443,824 | 611,424 | 0.00 |
| 101 | 2026-11-20T04:19:18Z | fad2aab9 | 567,608 | 554.3 | 9.02% | 6,443,824 | 614,720 | 0.00 |
| 102 | 2026-11-20T04:20:18Z | fad2aab9 | 618,412 | 603.9 | 9.83% | 6,443,824 | 608,048 | 0.63 |
| 103 | 2026-11-20T04:21:18Z | fad2aab9 | 620,360 | 605.8 | 9.86% | 6,443,824 | 601,000 | 0.37 |
| 104 | 2026-11-20T04:22:19Z | fad2aab9 | 604,496 | 590.3 | 9.61% | 6,443,824 | 601,212 | 0.14 |
| 105 | 2026-11-20T04:23:19Z | fad2aab9 | 571,832 | 558.4 | 9.09% | 6,443,824 | 601,252 | 0.05 |
| 106 | 2026-11-20T04:24:19Z | fad2aab9 | 577,504 | 564.0 | 9.18% | 6,443,824 | 603,956 | 0.02 |
| 107 | 2026-11-20T04:25:19Z | fad2aab9 | 589,720 | 575.9 | 9.37% | 6,443,824 | 608,652 | 0.07 |
| 108 | 2026-11-20T04:26:19Z | fad2aab9 | 658,900 | 643.5 | 10.47% | 6,443,824 | 722,372 | 0.12 |
| 109 | 2026-11-20T04:27:19Z | fad2aab9 | 644,124 | 629.0 | 10.24% | 6,443,824 | 741,404 | 0.11 |
| 110 | 2026-11-20T04:28:19Z | fad2aab9 | 584,340 | 570.6 | 9.29% | 6,443,824 | 770,104 | 0.11 |
| 111 | 2026-11-20T04:29:19Z | fad2aab9 | 550,404 | 537.5 | 8.75% | 6,443,824 | 772,792 | 0.04 |
| 112 | 2026-11-20T04:30:19Z | fad2aab9 | 571,388 | 558.0 | 9.08% | 6,443,824 | 772,924 | 0.01 |
| 113 | 2026-11-20T04:31:19Z | fad2aab9 | 574,224 | 560.8 | 9.13% | 6,443,824 | 773,104 | 0.00 |
| 114 | 2026-11-20T04:32:19Z | fad2aab9 | 568,824 | 555.5 | 9.04% | 6,443,824 | 772,600 | 0.10 |
| 115 | 2026-11-20T04:33:19Z | fad2aab9 | 566,976 | 553.7 | 9.01% | 6,443,824 | 772,612 | 0.04 |
| 116 | 2026-11-20T04:34:19Z | fad2aab9 | 548,268 | 535.4 | 8.71% | 6,443,824 | 772,644 | 0.01 |
| 117 | 2026-11-20T04:35:19Z | fad2aab9 | 563,508 | 550.3 | 8.96% | 6,443,824 | 772,744 | 0.00 |
| 118 | 2026-11-20T04:36:19Z | fad2aab9 | 612,568 | 598.2 | 9.74% | 6,443,824 | 728,212 | 0.60 |
| 119 | 2026-11-20T04:37:19Z | fad2aab9 | 1,081,064 | 1055.7 | 17.18% | 5,854,000 | 684,360 | 0.63 |
| 120 | 2026-11-20T04:38:19Z | fad2aab9 | 926,352 | 904.6 | 14.72% | 5,996,848 | 686,456 | 0.49 |
| 121 | 2026-11-20T04:39:19Z | fad2aab9 | 916,400 | 894.9 | 14.57% | 6,126,228 | 687,460 | 0.18 |
| 122 | 2026-11-20T04:40:19Z | fad2aab9 | 769,860 | 751.8 | 12.24% | 6,244,452 | 695,416 | 0.06 |
| 123 | 2026-11-20T04:41:19Z | fad2aab9 | 849,872 | 830.0 | 13.51% | 5,362,912 | 640,064 | 1.33 |
| 124 | 2026-11-20T04:42:19Z | fad2aab9 | 800,528 | 781.8 | 12.72% | 5,528,960 | 643,608 | 1.22 |
| 125 | 2026-11-20T04:43:19Z | fad2aab9 | 533,504 | 521.0 | 8.48% | 5,636,716 | 635,972 | 1.26 |
| 126 | 2026-11-20T04:44:19Z | fad2aab9 | 623,128 | 608.5 | 9.90% | 5,757,888 | 620,028 | 1.27 |
| 127 | 2026-11-20T04:45:19Z | fad2aab9 | 420,496 | 410.6 | 6.68% | 5,758,040 | 630,484 | 1.70 |
| 128 | 2026-11-20T04:46:19Z | fad2aab9 | 536,888 | 524.3 | 8.53% | 5,854,004 | 630,952 | 1.33 |
| 129 | 2026-11-20T04:47:19Z | fad2aab9 | 421,516 | 411.6 | 6.70% | 5,957,388 | 629,260 | 0.56 |
| 130 | 2026-11-20T04:48:19Z | fad2aab9 | 1,006,220 | 982.6 | 15.99% | 6,044,204 | 631,232 | 0.24 |
| 131 | 2026-11-20T04:49:19Z | fad2aab9 | 846,528 | 826.7 | 13.46% | 6,164,424 | 636,396 | 0.12 |
| 132 | 2026-11-20T04:50:19Z | fad2aab9 | 714,072 | 697.3 | 11.35% | 6,270,468 | 642,424 | 0.18 |
| 133 | 2026-11-20T04:51:19Z | fad2aab9 | 671,072 | 655.3 | 10.67% | 6,370,568 | 644,736 | 0.21 |
| 134 | 2026-11-20T04:52:19Z | fad2aab9 | 585,776 | 572.0 | 9.31% | 6,443,824 | 641,420 | 0.47 |
(Ghi chú: bảng trên trích bằng script trực tiếp từ `ram-sampler.log` (134 mẫu), không gõ tay — mọi giá trị khớp file gốc từng mẫu. Trong episode ghim chính 04:09–04:36Z, Balloon ghim cứng ở 6.443.824 kB; MemAvailable dao động chậm quanh 547–659k kB. T9 không làm tròn hay nội suy số liệu.)
