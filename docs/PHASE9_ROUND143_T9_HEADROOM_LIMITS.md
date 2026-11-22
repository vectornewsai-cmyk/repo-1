# LIMITS — Phase 9 đợt 143, T9: headroom inotify + RAM + guard birefnet (DƯỚI NGƯỠNG <1.800 LẦN THỨ BA; TỈ LỆ/VITE LẦN ĐẦU DƯỚI 1,0; REBOOT GIỮA CỬA SỔ ĐO)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 1.498** (đo 2 lần trên boot 70a5b0fc btime **01:55:25Z**: 1.498 lúc 02:40:53Z và **1.498** lúc 02:41:01Z 19/11, chênh **0**) — **GIẢM TIẾP**: 1.617 (đợt 142) → **1.498 (−119, −7,4%)**. Xem §1.
- **⚠️ VẪN DƯỚI NGƯỠNG BÁO USER (< ~1.800) — thấp hơn ngưỡng 302, lần thứ ba liên tiếp.** User đã được báo trong báo cáo đợt 141 (quyết parent (d) đợt 141) — đợt này **KHÔNG báo riêng nữa, chỉ tiếp tục theo dõi**; không yêu cầu user hành động; can thiệp host ngoài tầm cell. **Tỉ lệ/vite chỉ còn ~0,95 lần — LẦN ĐẦU TIÊN dưới 1,0** (đợt 142: 1,02): headroom không còn đủ cho 1 vite dev server đầy đủ (~1.578 watch). Xem §1.3, F-143-T9-1.
- **Đo lần 3 sau reboot (boot mới 691a7403, ~57 giây tuổi): headroom > 20.000** — KHÔNG gặp ENOSPC sau 20.000 watch. **Cửa sổ thoáng ngay sau boot XUẤT HIỆN TRỞ LẠI** (như đợt 140 và 142, khác đợt 141 đo được 1.719). Xem §1.4, F-143-T9-3.
- **RAM:** đỉnh **44,16% guard** — thấp hơn đợt 142 (48,70%). Max toàn cửa sổ (114 mẫu, hai vòng): **2.778.188 kB = 2.713,1 MiB lúc 02:49:11Z** (boot 70a5b0fc), thiếu **3.513.268 kB (~3.431,9 MiB)** mới tới guard 6.291.456 kB. Min toàn cửa sổ: **429.452 kB (419,4 MiB) lúc 03:46:14Z** (boot 70a5b0fc). **0 mẫu ≥ 6.144 MiB. Birefnet KHÔNG THỬ.** Xem §2.
- **Balloon virtio:** ĐÓNG BĂNG ở 6.443.824 kB (79,3% tổng RAM) trong **43/114 mẫu (37,7%)** — vòng 1: 4 đợt (1 + 5 + 13 + 11 mẫu); vòng 2: 2 đợt (2 + 11 mẫu). Giá trị đóng băng y hệt đợt 138/139/140/141/142 — **đợt thứ sáu liên tiếp**; balloon KHÔNG xả bền (chỉ xả răng cưa đầu mỗi vòng rồi đóng băng trở lại). Xem §2.2.
- **REBOOT GIỮA CỬA SỔ ĐO: boot 70a5b0fc chết, boot mới 691a7403 lên thay, btime 03:55:45Z.** Sampler vòng 1 bị SIGTERM giết cùng lúc (75 mẫu, 02:41:10–03:55:15Z); khởi động lại vòng 2 lúc 03:56:52Z (gap lấy mẫu ~1'37"). Khung chết boot cũ (theo dữ liệu T9): **(03:55:15Z, 03:55:45Z] (30 s)**. Boot cũ sống 01:55:25Z → 03:55:45Z = **2h00m20s**. Xem §5, F-143-T9-2.
- **Lượt yên WebKit #19 (T4, đợt 143): CHƯA XUẤT BẢN LIMITS lúc T9 đóng (04:38Z)** — T4 vẫn đang chạy (poll log + postboot gate0wait log còn cập nhật). Sampler T9 ghi độc lập: cả **12/12 mẫu đầu vòng 2 (03:56:52–04:07:52Z) đều ≥1024 MiB** — gate A giữ trong cửa sổ đó. T10 đối chiếu khi gộp. Xem §2.3, F-143-T9-5.
- Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào (journal 0 dòng "No space left"/ENOSPC trên boot mới). Replay dpkg trên boot 70a5b0fc chết yểu (2 dòng); trên boot mới 1.545 dòng lúc 04:00:38Z (gói cuối gstreamer1.0-tools 1.24.2-**1ubuntu0.2** — phiên bản thứ ba khác nhau trong ba đợt gần nhất, ghi nhận cho T5). T5 là chủ quản replay.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard — xem §3). Làm việc nhẹ (chỉ đo + sampler).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 143 (boot 70a5b0fc, btime 01:55:25Z — boot lúc mở đợt)

| Thời điểm (UTC 19/11) | Headroom | Bối cảnh |
|---|---|---|
| 02:40:53Z | **1.498** | lần đo 1, boot ~45' tuổi; RAM trước đo 430.000 kB, balloon 6.443.824 kB (đóng băng) |
| 02:41:01Z | **1.498** | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 886.084 kB, balloon 6.050.608 kB (xả tạm) |

- Probe dừng ở `i=1498` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh 0 trong cùng boot:** lần thứ sáu liên tiếp chuỗi T9 ghi chênh 0 ở cả hai lần đo chính (đợt 138, 139, 140, 141, 142 cũng 0). Giá trị đợt lấy **1.498**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 1.498 = **62.249 watch** (tăng ~119 so với 62.130 đợt 142).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 1.498 / 1.578 ≈ **0,95 lần** — **LẦN ĐẦU TIÊN tỉ lệ xuống dưới 1,0**: headroom không còn đủ cho một vite dev server đầy đủ chạy nối tiếp, chưa nói tới nhiều vite song song. (Đợt 142: 1,02 — lần đầu sát 1,02; đợt này phá vỡ mốc đó.)
- Lưu ý: RAM trước đo lần 1 chỉ 430.000 kB (balloon đóng băng); trước đo lần 2 là 886.084 kB (balloon đã xả tạm 6.050.608 kB) — headroom **không đổi** (1.498 = 1.498): headroom không đi theo RAM khả dụng trong cell, mà theo watch ngoài cell (như đợt 141, 142).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–142 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **143** | **1.498 → 1.498** | **đo 02:40:53Z → 02:41:01Z, boot 70a5b0fc btime 01:55:25Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 1.498 = **−2.940 (−66,2%)**. Bước giảm đợt này: −119 so với đợt 142 (−7,4%) — **đợt thứ mười bốn liên tiếp bước giảm nằm trong dải 101–127** (130: −116; 131: −117; 132: −108; 133: −106; 134: −127; 135: −110; 136: −114; 137: −106; 138: −111; 139: −110; 140: −114; 141: −101; 142: −122; 143: −119).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 1.498, thấp hơn ngưỡng 302, lần thứ ba liên tiếp.** Quyết parent đợt 141 (d): báo user trong báo cáo đợt 141 — **đã báo; đợt này KHÔNG báo riêng nữa**, chỉ tiếp tục theo dõi. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng báo.
- **Mốc mới: tỉ lệ/vite 0,95 — lần đầu dưới 1,0.** Headroom không còn đủ cho 1 vite đầy đủ (~1.578 watch). Đây là diễn biến đáng ghi cho parent/T10, nhưng quyết "chỉ theo dõi" vẫn đứng (brief đợt này + quyết parent đợt 141/142); T9 không tự nâng mức báo hay yêu cầu user hành động.
- Trần 63.747 vẫn đầy ở mức ~62,2k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

### 1.4 Đo lần 3 — boot mới 691a7403 (ngoài chuỗi, chỉ để đối chiếu)

- **Lần 3, 03:56:42Z (boot ~57 giây tuổi, btime 03:55:45Z): thêm 20.000 watch KHÔNG gặp ENOSPC** — headroom trên boot mới **> 20.000**. RAM trước đo 1.854.812 kB, balloon 5.017.472 kB, SwapFree 1.040.632 kB (swap gần trống sau reboot). File tạm đã dọn sạch.
- **Cửa sổ thoáng headroom >20.000 ngay sau boot XUẤT HIỆN TRỞ LẠI** — giống đợt 140 (lần 3 lúc boot 80 giây tuổi) và đợt 142 (lần 3 lúc boot ~50 giây tuổi), khác đợt 141 (lần 3 lúc boot 68 giây tuổi đã dừng ở 1.719). T4-142 §2.1 từng ghi độc lập cùng cửa sổ thoáng này ở đợt 142.
- **Không đưa >20.000 vào chuỗi §1.3** — chuỗi lấy giá trị ổn định trên boot lúc mở đợt (1.498, đo 2 lần chênh 0). Giá trị lần 3 chỉ là quan sát đối chiếu sau reboot.
- Hệ quả thực hành: **reboot vẫn KHÔNG reset chuỗi suy giảm headroom** — cửa sổ thoáng chỉ tồn tại trong ~1 phút đầu sau boot, trước khi các tiến trình giữ watch ngoài cell đăng ký lại; giá trị ổn định của đợt vẫn lấy trên boot mở đợt. Với đà ~101–127/đợt, các đợt sau sẽ đi sâu hơn dưới ngưỡng nếu không can thiệp host (chỉ là phép chia số học minh họa — KHÔNG phải dự báo).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler dài 114 mẫu, 02:41:10Z–04:34:54Z

### 2.1 Hình dạng cửa sổ: vòng 1 đỉnh sớm rồi kẹt thấp tới reboot; vòng 2 xả mạnh đầu rồi đóng băng tới hết

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **Vòng 1: 02:41:10–03:55:15Z, 75 mẫu, boot 70a5b0fc — bị SIGTERM giết cùng lúc reboot 03:55:45Z. Vòng 2: 03:56:52–04:34:54Z, 39 mẫu, boot mới 691a7403 — chạy tới hết hạn 04:35Z.** Tổng **114 mẫu** (xem bảng đầy đủ ở Phụ lục A + B). **Min toàn cửa sổ: 429.452 kB (419,4 MiB) lúc 03:46:14Z (boot cũ). Max toàn cửa sổ: 2.778.188 kB (2.713,1 MiB) lúc 02:49:11Z (boot cũ).** Mean vòng 1 ~831,1 MiB; mean vòng 2 ~957,9 MiB (trộn hai boot — chỉ để tham khảo, không dùng làm chỉ số).

**Boot 70a5b0fc (75 mẫu, 02:41:10–03:55:15Z) — đỉnh sớm rồi rơi đơn điệu về vùng trũng, balloon đóng băng trở lại:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 02:41:10Z | 1.148,2 MiB (1.175.724 kB) | mẫu đầu (balloon 5.657.392 kB); RAM lúc mở đợt đo trực tiếp 417.728 kB (408,0 MiB) lúc 02:40:36Z, trước sampler ~34 giây |
| 02:42:11–02:48:11Z | 1.453,6 → 1.780,4 MiB | leo dần (balloon xả 5.382.476 → 4.880.544 kB) |
| 02:49:11Z | **2.713,1 MiB (2.778.188 kB)** | **MAX toàn cửa sổ, 44,16% guard** (balloon min toàn cửa sổ 3.897.504 kB) |
| 02:50:11–02:52:11Z | 2.567,7 → 2.101,8 MiB | 3 mẫu còn ≥2.000.000 kB rồi rơi |
| 02:53:11–03:06:12Z | 1.873,8 → 1.160,4 MiB | rơi dần, chạm dưới gate A lúc 02:59:11Z (978,4 MiB) rồi nhô lại 1.160,4 MiB lúc 03:06:12Z — mẫu cuối ≥1024 MiB trên boot cũ |
| 03:07:12–03:12:12Z | ~0,6 GB → 517,9 MiB | rơi dưới gate A, không hồi lại trên boot cũ (03:10:12 638,4 MiB; 03:11:12 559,9 MiB) |
| 03:13:12Z | 473,3 MiB | balloon đóng băng 6.443.824 kB (1 mẫu, lẻ) |
| 03:17:12–03:21:13Z | ~0,5 GB | **đợt đóng băng 1**: balloon 6.443.824 kB (5 mẫu) |
| 03:22:13–03:24:13Z | 687,7 → 541,3 MiB | nhô nhẹ rồi lùi (balloon xả 6.247.216 kB) |
| 03:25:13–03:37:14Z | ~0,46–0,54 GB | **đợt đóng băng 2**: balloon 6.443.824 kB (**13 mẫu liên tục**) |
| 03:38:14–03:42:14Z | 898,1 → 507,7 MiB | nhô mạnh rồi rơi (balloon xả 6.050.608 kB) |
| 03:43:14–03:53:14Z | 419,4–~0,7 GB | **đợt đóng băng 3**: balloon 6.443.824 kB (**11 mẫu liên tục**); **MIN toàn cửa sổ 419,4 MiB lúc 03:46:14Z** (balloon vẫn đóng băng 6.443.824 kB — xem F-143-T9-6) |
| 03:54:14–03:55:15Z | 684,6 → 658,8 MiB | hồi nhẹ cuối vòng (balloon xả 6.247.216 → 6.311.792 kB) rồi reboot cắt |

- Sau 03:06:12Z, **không mẫu nào trên boot cũ vượt 1.048.576 kB (1024 MiB)**. Chỉ **4 mẫu ≥2.000.000 kB** (02:49:11–02:52:11Z, một đợt xả duy nhất đầu vòng).
- Load1 trong cửa sổ vòng 1: 0,00–4,38 (max 4,38 lúc 02:44:11Z — trùng lúc RAM đang leo, không phải lúc trũng). Nửa sau cửa sổ (03:25–03:55Z) load1 0,00–0,86 mà RAM vẫn phẳng ~0,45–0,65 GB: RAM thấp không phải do tải trong cell.
- Swap: SwapFree 630.408 kB lúc mẫu đầu → 609.412 kB lúc mẫu cuối vòng 1 (swap đang dùng ~410 MB).

**Boot mới 691a7403 (39 mẫu, 03:56:52–04:34:54Z) — xả mạnh đầu vòng rồi đóng băng tới hết:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 03:56:52Z | 1.793,6 MiB (1.836.656 kB) | mẫu đầu sau reboot (balloon 5.017.472 kB; SwapFree 990.952 kB — swap gần trống) |
| 03:57:52–04:00:52Z | 1.616,7 → 1.849,0 MiB | leo lại sau đỉnh đầu |
| 04:01:52Z | **2.367,0 MiB (2.423.852 kB)** | **MAX vòng 2, 38,53% guard** (balloon 4.538.000 kB) |
| 04:02:52–04:07:52Z | 2.093,2 → 1.143,9 MiB | rơi sau đỉnh; mẫu cuối ≥1024 MiB lúc 04:07:52Z |
| 04:08:52–04:13:53Z | ~1,0 GB → ~0,6 GB | rơi dưới gate A |
| 04:14:53–04:15:53Z | ~0,55 GB | balloon đóng băng 6.443.824 kB (2 mẫu) |
| 04:16:53–04:19:53Z | 831,1 → 526,4 MiB | rơi đơn điệu (balloon xả 6.132.492 kB) |
| 04:20:53–04:30:54Z | 492,1–~0,6 GB | **đợt đóng băng dài**: balloon 6.443.824 kB (**11 mẫu liên tục tới 04:30:54Z**); **MIN vòng 2: 492,1 MiB (503.896 kB) lúc 04:28:54Z** |
| 04:31:54–04:34:54Z | 886,1 → 742,6 MiB | hồi nhẹ cuối vòng (balloon xả 6.050.608 kB) tới hết hạn sampler |

- **12/12 mẫu đầu vòng 2 (03:56:52–04:07:52Z) đều ≥1024 MiB**; sau 04:07:52Z, **không mẫu nào vượt 1.048.576 kB**. Chỉ **2 mẫu ≥2.000.000 kB** (04:01:52–04:02:52Z).
- Load1 trong cửa sổ vòng 2: 0,00–4,56 (max 4,56 lúc 03:59:52Z — trùng lúc RAM đang leo sau reboot, đúng cửa sổ T4 chạy postboot gate0wait; xem §2.3). Nửa sau cửa sổ (04:20–04:30Z) load1 0,00–0,86 mà RAM vẫn phẳng ~0,5 GB: RAM thấp không phải do tải trong cell.
- Swap: SwapFree 990.952 kB (mẫu đầu vòng 2) → 649.592 kB lúc cuối (swap đang dùng ~390 MB sau ~38 phút).

### 2.2 Balloon virtio — xả răng cưa đầu mỗi vòng rồi đóng băng y hệt đợt 138/139/140/141/142

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Boot cũ: 5.657.392 kB (02:41:10Z) → xả sâu **min 3.897.504 kB lúc 02:49:11Z (48,0% tổng RAM, đúng lúc đỉnh RAM toàn cửa sổ)** → phình lại **6.443.824 kB** rồi **ĐÓNG BĂNG đúng giá trị này qua 30 mẫu** (4 đợt: 03:13:12Z 1 mẫu; 03:17:12–03:21:13Z 5 mẫu; 03:25:13–03:37:14Z 13 mẫu; 03:43:14–03:53:14Z 11 mẫu) → xả nhẹ 6.247.216 kB trước reboot.
- Boot mới: 5.017.472 kB (03:56:52Z) → xả **min 4.285.080 kB lúc 04:00:52Z** → phình lại **6.443.824 kB** rồi **ĐÓNG BĂNG đúng giá trị này qua 13 mẫu** (2 đợt: 04:14:53–04:15:53Z 2 mẫu; 04:20:53–04:30:54Z 11 mẫu) → xả nhẹ 6.050.608 kB cuối vòng.
- Tổng: balloon đóng băng 6.443.824 kB trong **43/114 mẫu (37,7% cửa sổ)**. Giá trị 6.443.824 kB lặp lại y hệt qua **sáu đợt (138 + 139 + 140 + 141 + 142 + 143)** và nhiều boot — dấu hiệu host giữ balloon ở một mức trần cố định — T9 chỉ ghi nhận, không kết luận cơ chế host.
- Ròng cả cửa sổ (mẫu đầu 02:41:10Z → mẫu cuối 04:34:54Z): balloon 5.657.392 kB → 6.190.660 kB = **+533.268 kB** (phình ròng). Lúc đóng (04:39:44Z, sau sampler): balloon 6.331.252 kB, RAM 644.724 kB.
- **Quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" — đợt 143 VẪN KHÔNG thấy xả bền:** balloon đóng băng 6.443.824 kB trong 43/114 mẫu và RAM phẳng ~0,5 GB suốt nửa sau mỗi vòng. Đây là **đợt thứ sáu liên tiếp** balloon đóng băng ở đúng giá trị này. Quyết parent đợt 139 đã ghi: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB. T9 không đề xuất đổi ngưỡng gate A (quyết đứng), chỉ ghi rõ dữ kiện để parent/T10 cân nhắc ở đợt 144.
- Số học lúc đỉnh RAM 02:49:11Z: tổng RAM 8.124.900 kB − balloon 3.897.504 kB = 4.227.396 kB còn lại cho hệ thống; trong đó MemAvailable 2.778.188 kB + free/cache ~1,45 GB. Lúc cuối cửa sổ 04:34:54Z: tổng RAM − balloon 6.190.660 kB = 1.934.240 kB còn lại; MemAvailable chỉ 760.400 kB.

### 2.3 Lượt yên WebKit #19 (T4, đợt 143) — CHƯA CÓ SỐ LÚC T9 ĐÓNG

- **T4-143 chưa xuất bản LIMITS lúc T9 đóng (04:38Z):** thư mục `round143-t4/` có poll log + postboot gate0wait log (tới gate0wait-97) nhưng chưa có file `PHASE9_ROUND143_T4_*_LIMITS.md` và chưa có cờ `.done`. T9 không tự đo tickCost (không thuộc phạm vi T9); **không có số median #19 trong file này** — T10 đối chiếu khi gộp (xem F-143-T9-5).
- Dữ kiện độc lập từ sampler T9 cho T4/T10: **cả 12/12 mẫu vòng 2 trong 03:56:52–04:07:52Z đều ≥1024 MiB** — gate A giữ suốt 11 phút đầu sau reboot; load1 max vòng 2 là 4,56 lúc 03:59:52Z (đúng lúc RAM leo 1.654,6 MiB), trùng cửa sổ T4 chạy postboot gate0wait. Trên boot cũ, mẫu cuối ≥1024 MiB là 03:06:12Z — sau đó không còn cửa yên nào trước reboot.
- Lượt yên tiếp theo (#19) đo ở đợt 143 theo kế hoạch đứng; ngưỡng ≤60 ms giữ. Chuỗi median 15 lượt hợp lệ tới đợt 142: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / **49,0 ms** (trung bình 47,9 ms) — số đợt 142 lấy từ file T4-142.

### 2.4 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

| Đợt | Lúc mở | Dao động trong lượt (sampler T9) | Cuối lượt |
|---|---|---|---|
| 124 | — | — | 1.664 MB |
| 125 | 1.140 MB | 987–2.378 MB | 1.788 MB |
| 126 | 1.247 MB | 834–2.551 MB | 1.666 MB |
| 127 | 547 MB (kỷ lục thấp T5) | 547–2.551 MB; 1.098–1.551 MB | ~1.102 MB |
| 128 | 1.557 MB (brief) | 1.286–1.557 MB (cửa sổ đo của T9, 45 giây) | — (không thuộc T9) |
| 129 | ~1.152 MB (brief) | 908–1.339 MB (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |
| 130 | ~1.025 MB (brief) | 688–1.246 MB (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |
| 131 | ~831 MB (brief; T9 đo trực tiếp 509 MB lúc 14:41:45Z) | 502–546 MB (cửa sổ đo của T9, ~3 phút) | — (không thuộc T9) |
| 132 | 1.095 MB (T9 đo trực tiếp lúc 17:40:33Z) | 857–1.095 MB, rơi đơn điệu (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |
| 133 | ~547 MB (brief; T9 đo trực tiếp 433 MB lúc 20:40:31Z) | 433–512 MB, hơi tăng về cuối (cửa sổ đo của T9, ~2,5 phút) | — (không thuộc T9) |
| 134 | ~1.295 MB (brief; T9 đo trực tiếp 460 MB lúc 23:45:07Z) | 460–2.438 MB theo sampler của T9, hồi mạnh rồi dao động (cửa sổ đo của T9, ~4,5 phút) | — (không thuộc T9) |
| 135 | ~1.177 MB (brief; T9 đo trực tiếp 1.004 MB lúc 02:40:37Z) | 844–1.734 MB theo sampler của T9, hồi giữa lượt rồi lùi (cửa sổ đo của T9, ~3,5 phút) | — (không thuộc T9) |
| 136 | ~1.374 MB (brief; T9 đo trực tiếp 1.406 MB lúc 05:40:43Z) | 1.406–6.081 MB theo sampler của T9, hồi giữa lượt mạnh nhất, rồi lùi về 5.653 MB (cửa sổ đo của T9, ~5,5 phút) | — (không thuộc T9) |
| 137 | — (brief không ghi; T9 đo trực tiếp 861 MB lúc 08:40:27Z, 787 MB lúc 08:41:12Z) | 787–2.123 MB theo sampler của T9, hồi giữa lượt rồi lùi về 1.635 MB (cửa sổ đo của T9, ~7,7 phút) | — (không thuộc T9) |
| 138 | — (brief không ghi; T9 đo trực tiếp 495.600 kB lúc 11:37:48Z, 771.924 kB lúc 11:39:22Z) | 772–6.087 MB (boot cũ, 14 mẫu, 11:39:50–11:52:51Z) rồi 462–1.819 MB (boot mới, 97 mẫu, 11:53:32–13:29:39Z); REBOOT 11:52:20Z cắt giữa hai pha (sampler dài của T9, ~111 phút) | 515 MiB lúc 13:29:39Z |
| 139 | ~547 MB (brief; T9 đo trực tiếp 489.600 kB lúc 14:39:53Z, 634.376 kB lúc 14:40:06Z) | 478–2.607 MB (boot cũ, 74 mẫu, 14:41:57–15:55:02Z) rồi 531–1.529 MB (boot mới, 35 mẫu, 15:57:11–16:31:13Z); REBOOT 15:54:37Z cắt giữa hai pha; gap lấy mẫu ~2'09" (sampler dài của T9, ~109 phút) | 557 MiB lúc 16:31:13Z (1.102 MB lúc 16:32:31Z, sau sampler) |
| 140 | ~0,89 GB (brief không ghi; T9 đo trực tiếp 910.388 kB lúc 17:38:54Z, 835.168 kB lúc 17:39:13Z) | 695–1.146 MiB (boot cũ, 15 mẫu, 17:39:13–17:53:15Z) rồi 463–2.242 MiB (boot mới, 77 mẫu, 17:55:20–19:11:26Z); REBOOT 17:52:56Z cắt giữa hai pha; gap lấy mẫu ~2 phút (sampler dài của T9, ~92 phút) | 523 MiB lúc 19:11:26Z (504 MB lúc 19:12:58Z, sau sampler) |
| 141 | ~0,39 GB (brief không ghi; T9 đo trực tiếp 403.376 kB lúc 20:40:21Z, 978.516 kB lúc 20:40:29Z) | 295–2.860 MiB (boot cũ, 72 mẫu, 20:40:47–21:51:52Z) rồi 564–1.891 MiB (boot mới, 35 mẫu, 21:53:23–22:27:25Z); REBOOT 21:52:21Z cắt giữa hai pha; gap lấy mẫu ~1'31" (sampler dài của T9, ~107 phút) | 592 MiB lúc 22:27:25Z (551 MB lúc 22:30:33Z, sau sampler) |
| 142 | ~0,45 GB (brief không ghi; T9 đo trực tiếp 464.260 kB lúc ~23:40Z, 495.108 kB lúc 23:41:20Z) | 485–1.149 MiB (boot cũ, 13 mẫu, 23:41:37–23:53:38Z) rồi 530–2.992 MiB (boot mới, 100 mẫu, 23:55:26Z–01:34:32Z); REBOOT 23:54:20Z cắt giữa hai pha; gap lấy mẫu ~1'48" (sampler dài của T9, ~113 phút) | 538 MiB lúc 01:34:32Z (576 MB lúc 01:39:26Z, sau sampler) |
| **143** | ****~0,41 GB (brief không ghi; T9 đo trực tiếp 417.728 kB lúc 02:40:36Z, 430.000 kB lúc 02:40:53Z)**** | ****419–2.713 MiB (boot cũ, 75 mẫu, 02:41:10–03:55:15Z) rồi 492–2.367 MiB (boot mới, 39 mẫu, 03:56:52–04:34:54Z); REBOOT 03:55:45Z cắt giữa hai pha; gap lấy mẫu ~1'37"** (sampler dài của T9, ~114 phút)** | ****743 MiB lúc 04:34:54Z (630 MB lúc 04:39:44Z, sau sampler)**** |

## 3. Guard birefnet — KHÔNG ĐẠT (44,16%), KHÔNG CHẠY

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 139 (e) + đợt 140 (f)(g) + đợt 141 (j) + đợt 142 GIỮ NGUYÊN quy trình + guard 6.144 MiB): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này (sampler T9, 114 mẫu, hai vòng): **2.778.188 kB = 2.713,1 MiB = 44,16% guard** lúc **02:49:11Z** (boot cũ, 4 mẫu ≥2.000.000 kB 02:49:11–02:52:11Z) — thiếu **3.513.268 kB (~3.431,9 MiB, ~55,8%)**.
- Không có mẫu nào trên boot cũ vượt 2.778.188 kB; không có mẫu nào trên boot mới vượt 2.423.852 kB (38,53% guard). **0 mẫu ≥ 6.144 MiB ở bất kỳ vòng nào.** Không có cửa sổ nào để thử. Watcher guard chạy suốt cả hai vòng tới 04:37:46Z — cờ guard-open.flag KHÔNG xuất hiện.
- Đỉnh đợt này (44,16%) thấp hơn đợt 142 (48,70%) và đợt 141 (46,55%) nhưng cao hơn đợt 140 (36,49%) và đợt 139 (42,44%); chuỗi đỉnh các đợt 136→143: 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB, 2.242 MB, 2.860 MB, 2.992 MB, **2.778 MB**. Vẫn cách guard hơn một nửa — khác hẳn đợt 138 (thiếu 57 MiB).
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói. Quy trình "thử ngay" đã được trực đúng (T9 ở lại muộn, sampler chạy tới 04:35:54Z, watcher guard chạy suốt cả hai vòng), cửa sổ chỉ không mở.

### 3.1 Sẵn sàng thử đã xác minh lại (02:42Z, chỉ đọc — không chạy)

- Venv: `server/bgremove/.venv/bin/python` tồn tại; `rembg 2.0.87`, `onnxruntime 1.23.2` import được (kiểm lại đợt này, khớp đợt 138/139/140/141/142).
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử đã chuẩn bị (chưa chạy — không đủ điều kiện guard): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-143-birefnet/out-birefnet-143.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-143-birefnet/` đã tạo sẵn, trống.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (kiểm tra `ps` lúc 02:40Z và lúc ~04:39Z; chỉ có tiến trình hệ thống + các luồng đợt 143) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 1.498 chỉ còn ~0,95 vite — **lần đầu không đủ cho 1 vite đầy đủ**, xem §1.2).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=1498, i=1498; lần 3 không gặp ENOSPC trong CAP 20.000) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal trên boot mới 691a7403: **0 dòng "No space left" / ENOSPC** (kiểm tra ~04:36Z). `journalctl --list-boots` chỉ hiện boot mới 691a7403 (first entry 03:55:55Z) — boot cũ không còn trong journal của cell, như đợt 138/139/140/141/142.
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 143 = boot lúc T9 đo đầu:** btime **01:55:25Z** 19/11 (`uptime -s` 01:55:25 + `btime 1795053325` trong `/proc/stat` + boot_id `70a5b0fc-6aae-4261-a3fe-11226162b5a3` + `who -b`: system boot Nov 19 01:55). Đây là boot mới lên sau đợt 142 (đợt 142 đóng trên boot 9afdaa89). **T2-142/143: 70a5b0fc = #104? TẠM** (ứng viên, chờ T2-143 chứng nhận bằng merged mù #62).
- **REBOOT GIỮA CỬA SỔ ĐO CỦA T9: boot mới 691a7403, btime 03:55:45Z** (`uptime -s` 03:55:45 + `btime 1795060545` + boot_id `691a7403-512b-4055-bb55-de0d7516eeeb` + `who -b`: system boot Nov 19 03:55 + journal first entry 03:55:55Z). Boot cũ sống 01:55:25Z → 03:55:45Z = **2h00m20s**. **T2-143: 691a7403 = ứng viên #105? TẠM**; reboot này là **#30** theo đếm nối tiếp (#29 là 9afdaa89→70a5b0fc trong lúc đóng sổ 142) — T2/T10 chốt số.
- **Khung chết boot cũ:** mốc cuối chắc chắn còn sống trên boot cũ theo dữ liệu T9 là mẫu sampler 03:55:15Z (674.632 kB) → khung **(03:55:15Z, 03:55:45Z] (30 s)**. T6/T2 là chủ quản chốt khung chết boot 70a5b0fc.
- **Runtime restart đi kèm reboot:** phiên exec sleep chờ của T9 bị SIGTERM giết cùng lúc reboot (~03:55Z); sampler vòng 1 (nohup) và watcher vòng 1 cũng bị giết cùng lúc. T9 khởi động lại sampler vòng 2 lúc 03:56:52Z (gap lấy mẫu ~1'37", 03:55:15Z → 03:56:52Z — xem F-143-T9-2). Không mất mẫu nào khác.
- **Replay: 2 dòng lúc T9 mở** (ghi cuối 01:55:54Z + 01:55:55Z `startup packages configure` ×2 — replay chết yểu trên boot 70a5b0fc, giống boot bde599df đợt 142). **Replay trên boot mới: 1.545 dòng lúc 04:00:38Z** (ghi cuối `status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2` — **khác 1.24.2-1.1ubuntu2 của đợt 142 và 1.24.2-1ubuntu0.1 của đợt 140/141: phiên bản thứ ba khác nhau trong ba đợt gần nhất**). **T5 là chủ quản replay — T9 chỉ ghi nhận số, không kết luận "xong"/"chưa xong".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.
- T7-143 chưa có cờ `.done` lúc T9 kiểm tra lần cuối (04:36Z) — T10 đối chiếu khi gộp.

## 6. Sai số của chính T9 (ghi rõ)

- **F-143-T9-1 — Headroom VẪN DƯỚI ngưỡng báo < ~1.800 (1.498, thấp hơn ngưỡng 302), lần thứ ba liên tiếp; tỉ lệ/vite LẦN ĐẦU DƯỚI 1,0 (~0,95):** hai lần đo chính trên boot 70a5b0fc đều 1.498 (chênh 0), cùng probe, cùng phương pháp — giá trị là thật, không phải sai số đo. Ngưỡng đã chạm ở đợt 141 và user đã được báo trong báo cáo đợt 141; đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng (brief đợt này + quyết parent đợt 141/142); T9 không tự nâng mức báo hay yêu cầu user hành động.
- **F-143-T9-2 — Khoảng trống lấy mẫu do reboot (~1'37") + sampler vòng 1 / watcher vòng 1 bị SIGTERM giết cùng lúc reboot:** khoảng trống 03:55:15Z → 03:56:52Z không có mẫu (vòng 2 khởi động lại 03:56:52Z). Phiên exec sleep chờ của T9 cũng bị SIGTERM giết cùng lúc (~03:55Z). Một lần vượt guard ngắn hơn 97 giây nằm trong khoảng trống này có thể không được quan sát — nhưng khoảng cách tới guard rất lớn (thiếu ~3.431,9 MiB lúc đỉnh) nên khả năng vượt lén là không đáng kể. (Cùng lớp F-142-T9-4.)
- **F-143-T9-3 — Cửa sổ thoáng headroom >20.000 ngay sau boot XUẤT HIỆN TRỞ LẠI ở boot 691a7403:** đo lần 3 lúc boot ~57 giây tuổi thêm 20.000 watch không gặp ENOSPC, giống đợt 140 và 142, khác đợt 141 (lần 3 lúc boot 68 giây tuổi đã dừng ở 1.719). Ba đợt dùng cùng phương pháp — chênh lệch là thật, không phải sai số đo. T9 ghi nhận là **quan sát**, không kết luận cơ chế (tiến trình giữ watch ngoài cell đăng ký lại chậm hơn sau reboot lần này, hoặc cửa sổ thoáng không tồn tại trên boot đợt 141 — ngoài tầm xác minh của cell). Giá trị chuỗi vẫn lấy 1.498; >20.000 không đưa vào chuỗi.
- **F-143-T9-4 — Watcher vòng 2 bị giết nhầm rồi khởi động lại (lỗi thao tác của T9, không mất dữ liệu):** lúc ~03:58Z T9 chạy `pkill -f 'guard-watcher-2.sh'` để sửa tail-log, pattern trùng command line của chính phiên exec nên phiên exec bị SIGTERM giết; watcher-2 (pid 2207) cũng chết. T9 khởi động lại watcher-2 ngay sau đó với script đã sửa (tail sang `ram-sampler-long-2.log`, khớp mẫu đợt 142). Sampler vòng 2 (pid 2206) không bị ảnh hưởng, chạy liên tục. Việc phát hiện guard không phụ thuộc watcher (sampler tự ghi cờ guard-open.flag) — không có cửa sổ guard nào bị bỏ sót ngoài gap reboot ở F-143-T9-2. Ghi rõ để lần sau dùng kill theo PID, không dùng pkill theo pattern trùng command line.
- **F-143-T9-5 — T4-143 chưa xuất bản LIMITS lúc T9 đóng (04:38Z):** file này KHÔNG có số median tickCost lượt yên #19; chỉ có dữ kiện sampler độc lập ở §2.3 (12/12 mẫu đầu vòng 2 ≥1024 MiB). T10 đối chiếu chéo khi gộp; không được lấy số T4 từ nguồn khác ngoài file T4-143.
- **F-143-T9-6 — Đính chính trong lúc viết LIMITS (bản nháp ghi sai vị trí MIN):** bản nháp §2.1 ghi MIN 419,4 MiB lúc 03:46:14Z "nằm ngay sau đợt đóng băng 2, balloon đã xả nhẹ 6.249.216 kB" — **sai**. Kiểm tra lại log trước khi đóng: lúc 03:46:14Z balloon = **6.443.824 kB (đang đóng băng)**, MIN nằm **trong đợt đóng băng 3 (03:43:14–03:53:14Z, 11 mẫu)**, không phải ngoài đợt đóng băng. Đã sửa §2.1 (tách rõ đợt nhô 03:38–03:42Z và đợt đóng băng 3 kèm MIN) trước khi đóng file. Không có số liệu nào khác bị ảnh hưởng.
- **F-143-T9-7 — Khoảng trống lấy mẫu 60 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "Không quan sát được ≥ 6.144 MiB" (kết luận §3) nghĩa đúng là **không có mẫu nào ≥ guard**, không phải chứng minh tuyệt đối "không lúc nào vượt". Đợt này khoảng cách tới guard rất lớn nên khả năng vượt lén là không đáng kể — khác đợt 138 (thiếu 57 MiB). (Cùng lớp F-142-T9-5.)
- **F-143-T9-8 — Nhãn "end=04:35Z" trong dòng SAMPLER START của script vòng 2 là text sed từ vòng 1:** END thực tế là 04:35:00Z 19/11 và SAMPLER END 04:35:54Z xác nhận — chỉ là nhãn hiển thị, không ảnh hưởng dữ liệu hay thời gian chạy. (Cùng lớp F-142-T9-7.)
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 144 (phần T9)

1. **⚠️ Headroom VẪN DƯỚI < ~1.800 (1.498, thấp hơn ngưỡng 302) — lần thứ ba liên tiếp dưới ngưỡng** (user đã được báo ở đợt 141; đợt này không báo riêng). **Tỉ lệ/vite ~0,95 — lần đầu dưới 1,0.** Tốc độ giảm mười bốn đợt gần nhất ~101–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng sâu hơn (chỉ là phép chia số học — KHÔNG phải dự báo). Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell.
2. **Guard birefnet giữ nguyên 6.144 MiB** (quyết parent đợt 136 §12.3(f) + đợt 138 §12.3(d) + đợt 139 (e) + đợt 140 (f)(g) + đợt 141 (j) + đợt 142) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Đỉnh đợt này 44,16% guard (thiếu ~3.431,9 MiB) — thấp hơn đợt 142 nhưng vẫn cách guard hơn một nửa; **giữ quy trình T9 ở lại muộn + sampler dài ở đợt sau**.
3. **Balloon đóng băng 6.443.824 kB trong 43/114 mẫu (37,7% cửa sổ)** — **đợt thứ sáu liên tiếp** ở đúng giá trị này; quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" chưa thấy hiệu quả ở đợt 139/140/141/142/143 (chỉ xả răng cưa đầu mỗi vòng rồi đóng băng trở lại); nếu đợt 144 vẫn ~500–600 MB thì parent/T10 mới xem có can thiệp host được không (T4 không tự ý hạ ngưỡng gate A). Quyết parent đợt 139: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB.
4. **Reboot giữa lượt 03:55:45Z, khung (03:55:15Z, 03:55:45Z] (30 s, theo dữ liệu T9)** — khung chết boot 70a5b0fc + số boot mới 691a7403 (#105? TẠM theo T2) chờ T2/T10 chốt; số reboot #30 chờ T10 chốt; replay boot mới 1.545 dòng, gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2** (phiên bản thứ ba khác nhau trong ba đợt gần nhất) — giao T5 đợt 143/144 đối chiếu. **Reboot KHÔNG reset chuỗi headroom:** cửa sổ thoáng >20.000 chỉ tồn tại ~1 phút đầu sau boot (xem §1.4, F-143-T9-3).
5. **Median tickCost lượt yên #19 (T4) CHƯA CÓ lúc T9 đóng** — T4-143 chưa xuất bản LIMITS (04:38Z); T10 đối chiếu khi gộp; ngưỡng ≤60 ms giữ.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 142 §11: mù #61 (T2 — đoạn B mở, tối đa 1 ẩn) + mù #62 mới mở, G1 chờ user quyết, R9 (a) số đếm 16, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND143_T9_HEADROOM_LIMITS.md` (file này) — **VƯỢT ngưỡng push thường 37.768 byte** (do Phụ lục A+B: bảng sampler đầy đủ 114 mẫu theo yêu cầu brief — không cắt dữ liệu cần thiết) — push cần `ENABLE_PRIVSEP=0` (như các file oversize đợt 138/139/140/141/142). Kích thước/md5 chính xác lấy trên đĩa lúc T10 gộp.
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round143-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round143-t9/headroom-measure-1.log` (đo lần 1), `headroom-measure-2.log` (đo lần 2), `headroom-measure-3-postreboot.log` (đo lần 3, boot mới), `ram-sampler-long.log` (vòng 1: 75 mẫu, 02:41:10–03:55:15Z), `ram-sampler-long-2.log` (vòng 2: 39 mẫu, 03:56:52–04:34:54Z), `ram-sampler-long.sh` + `ram-sampler-long-2.sh` (script hai vòng), `guard-watcher.sh` + `guard-watcher-2.sh` (watcher hai vòng), `appendix-vong1.md` + `appendix-vong2.md` (bảng sampler đã sinh), `guard-watcher.out` + `guard-watcher-2.out` (log watcher) — không nằm trong repo nên không stage.
- Cờ `round143-t9.done` đã tạo khi xong.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard).

## Phụ lục A. Bảng sampler đầy đủ — vòng 1 (75 mẫu, 60 s/mẫu, boot 70a5b0fc)

Nguồn: `hidden_files/round143-t9/ram-sampler-long.log` (02:41:10–03:55:15Z, bị SIGTERM giết cùng lúc reboot 03:55:45Z). Guard = 6.291.456 kB.
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 1 | 2026-11-19T02:41:10Z | 1175724 | 1148.2 | 5657392 | 630408 | 0.96 |
| 2 | 2026-11-19T02:42:11Z | 1488472 | 1453.6 | 5382476 | 651788 | 3.14 |
| 3 | 2026-11-19T02:43:11Z | 1491364 | 1456.4 | 5291148 | 651232 | 4.18 |
| 4 | 2026-11-19T02:44:11Z | 1376764 | 1344.5 | 5401524 | 654212 | 4.38 |
| 5 | 2026-11-19T02:45:11Z | 1245876 | 1216.7 | 5554660 | 655476 | 2.76 |
| 6 | 2026-11-19T02:46:11Z | 1204092 | 1175.9 | 5504260 | 638472 | 3.39 |
| 7 | 2026-11-19T02:47:11Z | 1311920 | 1281.2 | 5413716 | 640024 | 3.41 |
| 8 | 2026-11-19T02:48:11Z | 1823108 | 1780.4 | 4880544 | 641080 | 2.57 |
| 9 | 2026-11-19T02:49:11Z | 2778188 | 2713.1 | 3897504 | 649104 | 2.86 **← max** |
| 10 | 2026-11-19T02:50:11Z | 2629332 | 2567.7 | 4100744 | 654900 | 1.82 |
| 11 | 2026-11-19T02:51:11Z | 2402648 | 2346.3 | 4381860 | 659164 | 0.72 |
| 12 | 2026-11-19T02:52:11Z | 2152204 | 2101.8 | 4641640 | 659660 | 0.34 |
| 13 | 2026-11-19T02:53:11Z | 1918764 | 1873.8 | 4878392 | 678560 | 0.25 |
| 14 | 2026-11-19T02:54:11Z | 1677396 | 1638.1 | 5093752 | 683792 | 0.67 |
| 15 | 2026-11-19T02:55:11Z | 1402432 | 1369.6 | 5285512 | 684648 | 0.45 |
| 16 | 2026-11-19T02:56:11Z | 1411956 | 1378.9 | 5463016 | 803892 | 0.5 |
| 17 | 2026-11-19T02:57:11Z | 1243760 | 1214.6 | 5630380 | 806492 | 0.4 |
| 18 | 2026-11-19T02:58:11Z | 1128868 | 1102.4 | 5774684 | 776656 | 0.57 |
| 19 | 2026-11-19T02:59:11Z | 1001928 | 978.4 | 5913276 | 762580 | 0.42 |
| 20 | 2026-11-19T03:00:11Z | 829388 | 809.9 | 6038124 | 749160 | 0.48 |
| 21 | 2026-11-19T03:01:11Z | 723364 | 706.4 | 6149428 | 749064 | 0.39 |
| 22 | 2026-11-19T03:02:12Z | 610080 | 595.8 | 6248640 | 746040 | 0.27 |
| 23 | 2026-11-19T03:03:12Z | 800444 | 781.7 | 6115412 | 707532 | 0.8 |
| 24 | 2026-11-19T03:04:12Z | 656892 | 641.5 | 6219780 | 708896 | 0.44 |
| 25 | 2026-11-19T03:05:12Z | 641608 | 626.6 | 6293516 | 697764 | 1.14 |
| 26 | 2026-11-19T03:06:12Z | 1188260 | 1160.4 | 5752812 | 666756 | 1.45 |
| 27 | 2026-11-19T03:07:12Z | 945992 | 923.8 | 5884576 | 641572 | 1.31 |
| 28 | 2026-11-19T03:08:12Z | 910588 | 889.2 | 6010920 | 646560 | 0.61 |
| 29 | 2026-11-19T03:09:12Z | 768972 | 750.9 | 6115716 | 652700 | 0.22 |
| 30 | 2026-11-19T03:10:12Z | 653744 | 638.4 | 6224232 | 654736 | 0.38 |
| 31 | 2026-11-19T03:11:12Z | 573360 | 559.9 | 6317572 | 657176 | 0.2 |
| 32 | 2026-11-19T03:12:12Z | 530372 | 517.9 | 6379364 | 656804 | 0.25 |
| 33 | 2026-11-19T03:13:12Z | 484628 | 473.3 | 6443824 | 648484 | 0.47 |
| 34 | 2026-11-19T03:14:12Z | 698232 | 681.9 | 6247216 | 635520 | 0.65 |
| 35 | 2026-11-19T03:15:12Z | 589324 | 575.5 | 6311664 | 640504 | 0.24 |
| 36 | 2026-11-19T03:16:12Z | 536304 | 523.7 | 6401204 | 642484 | 0.12 |
| 37 | 2026-11-19T03:17:12Z | 521716 | 509.5 | 6443824 | 642848 | 0.67 |
| 38 | 2026-11-19T03:18:13Z | 482756 | 471.4 | 6443824 | 641368 | 0.71 |
| 39 | 2026-11-19T03:19:13Z | 487064 | 475.6 | 6443824 | 639340 | 0.26 |
| 40 | 2026-11-19T03:20:13Z | 473700 | 462.6 | 6443824 | 642996 | 0.16 |
| 41 | 2026-11-19T03:21:13Z | 512692 | 500.7 | 6443824 | 646280 | 0.55 |
| 42 | 2026-11-19T03:22:13Z | 704224 | 687.7 | 6247216 | 612520 | 1.05 |
| 43 | 2026-11-19T03:23:13Z | 581904 | 568.3 | 6312368 | 617884 | 0.38 |
| 44 | 2026-11-19T03:24:13Z | 554312 | 541.3 | 6401784 | 622208 | 0.14 |
| 45 | 2026-11-19T03:25:13Z | 506244 | 494.4 | 6443824 | 623348 | 0.52 |
| 46 | 2026-11-19T03:26:13Z | 487412 | 476.0 | 6443824 | 629572 | 0.19 |
| 47 | 2026-11-19T03:27:13Z | 490804 | 479.3 | 6443824 | 631112 | 0.12 |
| 48 | 2026-11-19T03:28:13Z | 475636 | 464.5 | 6443824 | 631404 | 0.08 |
| 49 | 2026-11-19T03:29:13Z | 457672 | 446.9 | 6443824 | 628308 | 0.17 |
| 50 | 2026-11-19T03:30:13Z | 477496 | 466.3 | 6443824 | 630984 | 0.32 |
| 51 | 2026-11-19T03:31:13Z | 500268 | 488.5 | 6443824 | 635860 | 0.19 |
| 52 | 2026-11-19T03:32:13Z | 482520 | 471.2 | 6443824 | 635616 | 0.16 |
| 53 | 2026-11-19T03:33:13Z | 481008 | 469.7 | 6443824 | 635740 | 0.06 |
| 54 | 2026-11-19T03:34:13Z | 467320 | 456.4 | 6443824 | 637572 | 0.05 |
| 55 | 2026-11-19T03:35:13Z | 473648 | 462.5 | 6443824 | 637688 | 0.15 |
| 56 | 2026-11-19T03:36:13Z | 481708 | 470.4 | 6443824 | 638044 | 0.05 |
| 57 | 2026-11-19T03:37:14Z | 503156 | 491.4 | 6443824 | 634504 | 0.49 |
| 58 | 2026-11-19T03:38:14Z | 919696 | 898.1 | 6050608 | 608956 | 0.95 |
| 59 | 2026-11-19T03:39:14Z | 839788 | 820.1 | 6130268 | 609392 | 0.39 |
| 60 | 2026-11-19T03:40:14Z | 722784 | 705.8 | 6239744 | 609740 | 0.17 |
| 61 | 2026-11-19T03:41:14Z | 623064 | 608.5 | 6338704 | 613340 | 0.06 |
| 62 | 2026-11-19T03:42:14Z | 519912 | 507.7 | 6424160 | 626288 | 0.02 |
| 63 | 2026-11-19T03:43:14Z | 450388 | 439.8 | 6443824 | 626628 | 0.01 |
| 64 | 2026-11-19T03:44:14Z | 472684 | 461.6 | 6443824 | 626908 | 0.0 |
| 65 | 2026-11-19T03:45:14Z | 484852 | 473.5 | 6443824 | 625788 | 0.0 |
| 66 | 2026-11-19T03:46:14Z | 429452 | 419.4 | 6443824 | 626312 | 0.0 **← min** |
| 67 | 2026-11-19T03:47:14Z | 479432 | 468.2 | 6443824 | 630952 | 0.22 |
| 68 | 2026-11-19T03:48:14Z | 485308 | 473.9 | 6443824 | 631132 | 0.13 |
| 69 | 2026-11-19T03:49:14Z | 487448 | 476.0 | 6443824 | 630464 | 0.23 |
| 70 | 2026-11-19T03:50:14Z | 478572 | 467.4 | 6443824 | 630736 | 0.08 |
| 71 | 2026-11-19T03:51:14Z | 473616 | 462.5 | 6443824 | 630932 | 0.16 |
| 72 | 2026-11-19T03:52:14Z | 494452 | 482.9 | 6443824 | 625056 | 0.09 |
| 73 | 2026-11-19T03:53:14Z | 483504 | 472.2 | 6443824 | 628300 | 0.11 |
| 74 | 2026-11-19T03:54:14Z | 701016 | 684.6 | 6247216 | 605780 | 0.76 |
| 75 | 2026-11-19T03:55:15Z | 674632 | 658.8 | 6311792 | 609412 | 0.31 |

## Phụ lục B. Bảng sampler đầy đủ — vòng 2 (39 mẫu, 60 s/mẫu, boot 691a7403)

Nguồn: `hidden_files/round143-t9/ram-sampler-long-2.log` (03:56:52–04:34:54Z, SAMPLER END 04:35:54Z). Số thứ tự nối tiếp vòng 1 (#76–#114). Guard = 6.291.456 kB.
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 76 | 2026-11-19T03:56:52Z | 1836656 | 1793.6 | 5017472 | 990952 | 3.94 |
| 77 | 2026-11-19T03:57:52Z | 1655536 | 1616.7 | 5221036 | 902620 | 3.69 |
| 78 | 2026-11-19T03:58:52Z | 1065580 | 1040.6 | 5017820 | 737928 | 3.99 |
| 79 | 2026-11-19T03:59:52Z | 1694288 | 1654.6 | 4469620 | 707748 | 4.56 |
| 80 | 2026-11-19T04:00:52Z | 1893404 | 1849.0 | 4285080 | 704204 | 3.24 |
| 81 | 2026-11-19T04:01:52Z | 2423852 | 2367.0 | 4538000 | 709332 | 1.44 **← max** |
| 82 | 2026-11-19T04:02:52Z | 2143432 | 2093.2 | 4793936 | 710484 | 0.64 |
| 83 | 2026-11-19T04:03:52Z | 1891860 | 1847.5 | 5024700 | 711272 | 0.3 |
| 84 | 2026-11-19T04:04:52Z | 1709532 | 1669.5 | 5229792 | 739688 | 0.39 |
| 85 | 2026-11-19T04:05:52Z | 1517808 | 1482.2 | 5424292 | 739932 | 0.3 |
| 86 | 2026-11-19T04:06:52Z | 1352024 | 1320.3 | 5601212 | 739144 | 0.33 |
| 87 | 2026-11-19T04:07:52Z | 1171348 | 1143.9 | 5762252 | 739520 | 0.26 |
| 88 | 2026-11-19T04:08:52Z | 1038044 | 1013.7 | 5909296 | 737592 | 0.22 |
| 89 | 2026-11-19T04:09:53Z | 914796 | 893.4 | 6042096 | 732352 | 0.24 |
| 90 | 2026-11-19T04:10:53Z | 804904 | 786.0 | 6160280 | 725916 | 0.09 |
| 91 | 2026-11-19T04:11:53Z | 659276 | 643.8 | 6270956 | 709112 | 0.16 |
| 92 | 2026-11-19T04:12:53Z | 720036 | 703.2 | 6272948 | 692560 | 0.14 |
| 93 | 2026-11-19T04:13:53Z | 602148 | 588.0 | 6368084 | 691396 | 0.05 |
| 94 | 2026-11-19T04:14:53Z | 527444 | 515.1 | 6443824 | 691684 | 0.02 |
| 95 | 2026-11-19T04:15:53Z | 577240 | 563.7 | 6443824 | 660548 | 0.73 |
| 96 | 2026-11-19T04:16:53Z | 851008 | 831.1 | 6132492 | 665168 | 0.3 |
| 97 | 2026-11-19T04:17:53Z | 722052 | 705.1 | 6245784 | 668924 | 0.21 |
| 98 | 2026-11-19T04:18:53Z | 635460 | 620.6 | 6347252 | 669076 | 0.34 |
| 99 | 2026-11-19T04:19:53Z | 539036 | 526.4 | 6439932 | 670236 | 0.12 |
| 100 | 2026-11-19T04:20:53Z | 527300 | 514.9 | 6443824 | 670772 | 0.04 |
| 101 | 2026-11-19T04:21:53Z | 526480 | 514.1 | 6443824 | 671092 | 0.06 |
| 102 | 2026-11-19T04:22:53Z | 532032 | 519.6 | 6443824 | 671744 | 0.02 |
| 103 | 2026-11-19T04:23:53Z | 536200 | 523.6 | 6443824 | 671868 | 0.1 |
| 104 | 2026-11-19T04:24:53Z | 521032 | 508.8 | 6443824 | 671320 | 0.04 |
| 105 | 2026-11-19T04:25:53Z | 514916 | 502.8 | 6443824 | 676900 | 0.09 |
| 106 | 2026-11-19T04:26:54Z | 537076 | 524.5 | 6443824 | 677704 | 0.16 |
| 107 | 2026-11-19T04:27:54Z | 519916 | 507.7 | 6443824 | 681004 | 0.06 |
| 108 | 2026-11-19T04:28:54Z | 503896 | 492.1 | 6443824 | 681512 | 0.08 **← min** |
| 109 | 2026-11-19T04:29:54Z | 506092 | 494.2 | 6443824 | 682484 | 0.03 |
| 110 | 2026-11-19T04:30:54Z | 505480 | 493.6 | 6443824 | 682684 | 0.13 |
| 111 | 2026-11-19T04:31:54Z | 907336 | 886.1 | 6050608 | 669480 | 0.74 |
| 112 | 2026-11-19T04:32:54Z | 1009488 | 985.8 | 5940348 | 657376 | 0.5 |
| 113 | 2026-11-19T04:33:54Z | 901272 | 880.1 | 6070872 | 651340 | 0.26 |
| 114 | 2026-11-19T04:34:54Z | 760400 | 742.6 | 6190660 | 649592 | 0.09 |
