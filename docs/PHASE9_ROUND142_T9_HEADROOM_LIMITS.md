# LIMITS — Phase 9 đợt 142, T9: headroom inotify + RAM + guard birefnet (DƯỚI NGƯỠNG <1.800 LẦN THỨ HAI; REBOOT KÉP/DỊ THƯỜNG BOOT_ID; CỬA SỔ THOÁNG SAU REBOOT XUẤT HIỆN TRỞ LẠI)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 1.617** (đo 2 lần trên boot bde599df btime **22:48:05Z**: 1.617 lúc ~23:40Z và **1.617** lúc 23:41:20Z 18/11, chênh **0**) — **GIẢM TIẾP**: 1.739 (đợt 141) → **1.617 (−122, −7,0%)**. Xem §1.
- **⚠️ VẪN DƯỚI NGƯỠNG BÁO USER (< ~1.800) — thấp hơn ngưỡng 183, lần thứ hai liên tiếp.** Ngưỡng đã chạm ở đợt 141 và **user đã được báo trong báo cáo đợt 141** (quyết parent (d) đợt 141) — đợt này **KHÔNG báo riêng nữa, chỉ tiếp tục theo dõi**; không yêu cầu user hành động; can thiệp host ngoài tầm cell. Chỉ còn ~**1,02 lần** số watch vite thường cần (~1.578) — sát giới hạn 1 vite nối tiếp. Xem §1.3, F-142-T9-1.
- **Đo lần 3 sau reboot (boot mới 9afdaa89, ~50 giây tuổi): headroom > 20.000** — KHÔNG gặp ENOSPC sau 20.000 watch. **Cửa sổ thoáng ngay sau boot XUẤT HIỆN TRỞ LẠI** (như đợt 140, khác đợt 141 đo được 1.719). Xem §1.4, F-142-T9-3.
- **RAM:** đỉnh **48,70% guard — cao nhất kể từ đợt 138 (99,07%)**, cao hơn đợt 141 (46,55%). Max toàn cửa sổ (113 mẫu, hai vòng): **3.063.852 kB = 2.992,0 MiB lúc 00:05:26Z** (boot 9afdaa89), thiếu **3.227.604 kB (~3.152,0 MiB)** mới tới guard 6.291.456 kB. Min toàn cửa sổ: **496.396 kB (484,8 MiB) lúc 23:41:37Z** (boot bde599df). **0 mẫu ≥ 6.144 MiB. Birefnet KHÔNG THỬ.** Xem §2.
- **Balloon virtio:** ĐÓNG BĂNG ở 6.443.824 kB (79,3% tổng RAM) trong **37/113 mẫu (32,7%)** — vòng 2: 2 đợt (10 mẫu 00:56:30–01:05:30Z + **25 mẫu liên tục 01:10:31–01:34:32Z tới hết cửa sổ**). Giá trị đóng băng y hệt đợt 138/139/140/141 — **đợt thứ năm liên tiếp**; balloon KHÔNG xả bền (chỉ xả răng cưa đầu vòng 2 rồi đóng băng trở lại). Xem §2.2.
- **REBOOT GIỮA CỬA SỔ ĐO: boot bde599df chết, boot mới 9afdaa89 lên thay, btime 23:54:20Z.** Sampler vòng 1 bị SIGTERM giết cùng lúc (13 mẫu, 23:41:37–23:53:38Z); khởi động lại vòng 2 lúc 23:55:26Z (gap lấy mẫu ~1'48"). Khung chết boot cũ (theo dữ liệu T9): **(23:53:38Z, 23:54:20Z] (42 s)**; gộp với T4 (23:53:55Z, 23:54:20Z] (25 s). **Dị thường: T9 quan sát được boot_id b47f7932 (btime 23:53:38Z) lúc 23:54:36Z** — mâu thuẫn btime 9afdaa89 + hồ sơ T2/T4; ghi là dị thường, giao T2/T10 chốt, không khẳng định là boot thật. Xem §5, F-142-T9-2.
- **Median tickCost lượt yên #18 (T4, đợt 142): 49,0 ms** (attempt3, 20/20 pass, n=451; tổng n=615 median 47,0 ms) ≤ 60 ms — **HỢP LỆ**. Chuỗi 15 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / **49,0 ms** (trung bình 47,9 ms). Cả 24 mẫu sampler trong cửa sổ T4 (00:00–00:23Z) đều ≥1024 MiB — gate A giữ suốt. Xem §2.3.
- Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào (journal 0 dòng "No space left"/ENOSPC từ btime 22:48:05Z). Replay dpkg trên boot bde599df chết yểu (2 dòng); trên boot mới replay xong 1.545 dòng lúc 23:58:47Z (gói cuối gstreamer1.0-tools 1.24.2-**1.1ubuntu2** — khác 1ubuntu0.1 đợt 140/141, ghi nhận cho T5). T5 là chủ quản replay.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard — xem §3). Làm việc nhẹ (chỉ đo + sampler).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 142 (boot bde599df, btime 22:48:05Z — boot lúc mở đợt)

| Thời điểm (UTC 18/11) | Headroom | Bối cảnh |
|---|---|---|
| ~23:40Z | **1.617** | lần đo 1, boot ~52' tuổi; RAM trước đo 464.260 kB, balloon 6.443.824 kB (đóng băng) |
| 23:41:20Z | **1.617** | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 495.108 kB, balloon 6.443.824 kB (đóng băng) |

- Probe dừng ở `i=1617` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh 0 trong cùng boot:** lần thứ năm liên tiếp chuỗi T9 ghi chênh 0 ở cả hai lần đo chính (đợt 138, 139, 140, 141 cũng 0). Giá trị đợt lấy **1.617**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 1.617 = **62.130 watch** (tăng ~122 so với 62.008 đợt 141).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 1.617 / 1.578 ≈ **1,02 lần** — chỉ vừa đủ cho ~1 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch. **Đây là lần đầu tỉ lệ xuống sát 1,02** (đợt 141: 1,10).
- Lưu ý: RAM trước đo lần 1 chỉ 464.260 kB (balloon đóng băng); trước đo lần 2 là 495.108 kB (balloon vẫn đóng băng) — headroom **không đổi** (1.617 = 1.617): headroom không đi theo RAM khả dụng trong cell, mà theo watch ngoài cell (như đợt 141).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–141 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **142** | **1.617 → 1.617** | **đo ~23:40Z → 23:41:20Z, boot bde599df btime 22:48:05Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 1.617 = **−2.821 (−63,6%)**. Bước giảm đợt này: −122 so với đợt 141 (−7,0%) — **đợt thứ mười ba liên tiếp bước giảm nằm trong dải 101–127** (130: −116; 131: −117; 132: −108; 133: −106; 134: −127; 135: −110; 136: −114; 137: −106; 138: −111; 139: −110; 140: −114; 141: −101; 142: −122).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 1.617, thấp hơn ngưỡng 183, lần thứ hai liên tiếp.** Quyết parent đợt 141 (d): báo user trong báo cáo đợt 141 — **đã báo; đợt này KHÔNG báo riêng nữa**, chỉ tiếp tục theo dõi. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng báo.
- Trần 63.747 vẫn đầy ở mức ~62,1k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

### 1.4 Đo lần 3 — boot mới 9afdaa89 (ngoài chuỗi, chỉ để đối chiếu)

- **Lần 3, 23:55:10Z (boot ~50 giây tuổi, btime 23:54:20Z): thêm 20.000 watch KHÔNG gặp ENOSPC** — headroom trên boot mới **> 20.000**. RAM trước đo 1.960.260 kB, balloon 4.943.404 kB, SwapFree ~1.040.580 kB (swap gần trống sau reboot). File tạm đã dọn sạch.
- **Cửa sổ thoáng headroom >20.000 ngay sau boot XUẤT HIỆN TRỞ LẠI** — giống đợt 140 (lần 3 lúc boot 80 giây tuổi thêm 20.000 watch không gặp ENOSPC), khác đợt 141 (lần 3 lúc boot 68 giây tuổi đã dừng ở 1.719). T4-142 §2.1 ghi độc lập: RAMavail vọt 1.935 MB lúc 23:54:25Z (balloon xả mạnh 6.086.092 → 4.943.632 kB) — cùng cửa sổ thoáng này.
- **Không đưa >20.000 vào chuỗi §1.3** — chuỗi lấy giá trị ổn định trên boot lúc mở đợt (1.617, đo 2 lần chênh 0). Giá trị lần 3 chỉ là quan sát đối chiếu sau reboot.
- Hệ quả thực hành: **reboot vẫn KHÔNG reset chuỗi suy giảm headroom** — cửa sổ thoáng chỉ tồn tại trong ~1 phút đầu sau boot, trước khi các tiến trình giữ watch ngoài cell đăng ký lại; giá trị ổn định của đợt vẫn lấy trên boot mở đợt. Với đà ~101–127/đợt, các đợt sau sẽ đi sâu hơn dưới ngưỡng nếu không can thiệp host (chỉ là phép chia số học minh họa — KHÔNG phải dự báo).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler dài 113 mẫu, 23:41:37Z–01:34:32Z

### 2.1 Hình dạng cửa sổ: vòng 1 kẹt thấp rồi reboot cắt; vòng 2 xả răng cưa mạnh đầu rồi đóng băng tới hết

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **Vòng 1: 23:41:37–23:53:38Z, 13 mẫu, boot bde599df — bị SIGTERM giết cùng lúc reboot 23:54:20Z. Vòng 2: 23:55:26Z–01:34:32Z, 100 mẫu, boot mới 9afdaa89 — chạy tới hết hạn 01:35Z.** Tổng **113 mẫu** (xem bảng đầy đủ ở Phụ lục A + B). **Min toàn cửa sổ: 496.396 kB (484,8 MiB) lúc 23:41:37Z (boot cũ). Max toàn cửa sổ: 3.063.852 kB (2.992,0 MiB) lúc 00:05:26Z (boot mới).** Mean vòng 1 ~741,4 MiB; mean vòng 2 ~1.086,0 MiB (trộn hai boot — chỉ để tham khảo, không dùng làm chỉ số).

**Boot bde599df (13 mẫu, 23:41:37–23:53:38Z) — kẹt thấp, balloon đóng băng trở lại rồi xả mạnh cuối vòng:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 23:41:37Z | 484,8 MiB (496.396 kB) | mẫu đầu (balloon 6.443.824 kB, đóng băng); **MIN toàn cửa sổ** |
| 23:42:37Z | 756,0 MiB (774.132 kB) | balloon xả tạm 6.087.484 kB |
| 23:43:37Z | **1.149,2 MiB (1.176.808 kB)** | **MAX vòng 1, 18,70% guard** (balloon min vòng 1: 5.731.036 kB); mẫu duy nhất ≥1024 MiB của vòng 1 |
| 23:44:37–23:49:38Z | 954,2 → 525,8 MiB | rơi đơn điệu sau đỉnh |
| 23:50:38Z | 510,1 MiB (522.308 kB) | balloon đóng băng trở lại 6.443.824 kB (1 mẫu) |
| 23:51:38–23:53:38Z | 748,2–826,9 MiB | hồi nhẹ cuối vòng (balloon xả 6.086.092 kB) rồi reboot cắt |

- Sau đỉnh 23:43:37Z, **không mẫu nào trên boot cũ vượt 1.176.808 kB**. T4-142 §2.1 ghi độc lập cùng hình dạng: RAMavail 1.935 MB lúc 23:54:25Z (balloon xả mạnh 6.086.092 → 4.943.632 kB) — nhưng poll #17 của T4 không bao giờ chạy vì reboot giết poller; cửa yên trên boot cũ mất.
- Load1 trong cửa sổ vòng 1: 0,43–1,81 — máy tương đối yên mà RAM vẫn kẹt ~0,5–0,8 GB: RAM thấp không phải do tải trong cell, mà do balloon host giữ.
- Swap: SwapFree 638.472 kB lúc mẫu đầu → 687.128 kB lúc mẫu cuối vòng 1 (swap đang dùng ~340 MB).

**Boot mới 9afdaa89 (100 mẫu, 23:55:26Z–01:34:32Z) — xả răng cưa mạnh đầu vòng rồi đóng băng tới hết:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 23:55:26Z | 1.757,2 MiB (1.799.332 kB) | mẫu đầu sau reboot (balloon 5.018.952 kB; SwapFree 1.020.804 kB — swap gần trống) |
| 23:56:26–00:04:26Z | 1.617,4 → 1.162,1 MiB | rơi đơn điệu sau đỉnh đầu |
| 00:05:26Z | **2.992,0 MiB (3.063.852 kB)** | **MAX toàn cửa sổ, 48,70% guard** (balloon min toàn cửa sổ 3.842.512 kB) |
| 00:06:26–00:08:27Z | 2.679,4 → 2.127,7 MiB | 3 mẫu còn ≥2.000.000 kB rồi rơi |
| 00:09:27–00:11:27Z | 1.895,7 → 1.135,3 MiB | rơi về ~1,1 GB |
| 00:12:27–00:16:27Z | 2.007,0 → 2.378,0 MiB | **đợt xả thứ hai**: đỉnh 2.867,7 MiB lúc 00:14:27Z (balloon 3.908.124 kB) |
| 00:17:27–00:28:28Z | 1.642,9 → 1.030,2 MiB | rơi dần; **đợt xả thứ ba** nhỏ: 2.247,8 MiB lúc 00:21:27Z |
| 00:29:28–00:55:30Z | 869,5 MiB → ~0,55 GB | rơi đơn điệu về vùng trũng |
| 00:56:30–01:05:30Z | 529,7–~0,6 GB | **vùng trũng 1**: balloon đóng băng 6.443.824 kB (10 mẫu); min vòng 2: 529,7 MiB (542.380 kB) lúc 01:03:30Z |
| 01:06:30–01:09:31Z | ~0,6–0,7 GB | nhô nhẹ rồi lùi |
| 01:10:31–01:34:32Z | 537,8–597,2 MiB | **vùng trũng 2**: balloon đóng băng suốt **25 mẫu liên tục tới hết cửa sổ** |

- **11 mẫu ≥2.000.000 kB** (00:05:26–00:22:28Z, 3 đợt xả); **42/100 mẫu vòng 2 ≥1024 MiB**. Sau 00:28:28Z, **không mẫu nào vượt 1.349.096 kB** (00:30:28Z) và sau 00:55:30Z không mẫu nào vượt ~0,7 GB.
- Load1 trong cửa sổ vòng 2: 0,00–4,82 (max 4,82 lúc 00:02:26Z — trùng attempt1/attempt2 của T4 nhiễm tải, xem §2.3). Nửa sau cửa sổ (01:10–01:34Z) load1 0,00–0,86 mà RAM vẫn phẳng ~0,55 GB: RAM thấp không phải do tải trong cell.
- Swap: SwapFree 1.020.804 kB (mẫu đầu vòng 2) → 677.500 kB lúc cuối (swap đang dùng ~370 MB sau ~99 phút).

### 2.2 Balloon virtio — xả răng cưa đầu vòng 2 rồi đóng băng y hệt đợt 138/139/140/141

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Boot cũ: 6.443.824 kB (23:41:37Z, đóng băng) → xả xuống **min 5.731.036 kB lúc 23:43:37Z (đúng lúc đỉnh RAM vòng 1)** → phình lại **6.443.824 kB** (23:50:38Z, 1 mẫu) → xả lại 6.086.092 kB trước reboot.
- Boot mới: 5.018.952 kB (23:55:26Z) → xả sâu **min 3.842.512 kB lúc 00:05:26Z (47,3% tổng RAM, đúng lúc đỉnh RAM toàn cửa sổ)** → răng cưa 00:05–00:28Z (3 lần xả: 3.842.512 / 3.908.124 / 4.554.864 kB) → phình lại **6.443.824 kB** rồi **ĐÓNG BĂNG đúng giá trị này qua 35 mẫu** (2 đợt: 00:56:30–01:05:30Z 10 mẫu; 01:10:31–01:34:32Z 25 mẫu).
- Tổng: balloon đóng băng 6.443.824 kB trong **37/113 mẫu (32,7% cửa sổ)**. Giá trị 6.443.824 kB lặp lại y hệt qua **năm đợt (138 + 139 + 140 + 141 + 142)** và nhiều boot — dấu hiệu host giữ balloon ở một mức trần cố định — T9 chỉ ghi nhận, không kết luận cơ chế host.
- Ròng cả cửa sổ (mẫu đầu 23:41:37Z → mẫu cuối 01:34:32Z): balloon 6.443.824 kB → 6.443.824 kB = **không đổi** (đầu và cuối cùng giá trị đóng băng). Lúc đóng (01:39:26Z, sau sampler): balloon đã xả nhẹ về 6.378.008 kB, RAM 589.456 kB.
- **Quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" — đợt 142 VẪN KHÔNG thấy xả bền:** balloon đóng băng 6.443.824 kB trong 37/113 mẫu và RAM phẳng ~0,55 GB suốt 24 phút cuối cửa sổ. Đây là **đợt thứ năm liên tiếp** balloon đóng băng ở đúng giá trị này. Quyết parent đợt 139 đã ghi: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB. T9 không đề xuất đổi ngưỡng gate A (quyết đứng), chỉ ghi rõ dữ kiện để parent/T10 cân nhắc ở đợt 143.
- Số học lúc đỉnh RAM 00:05:26Z: tổng RAM 8.124.900 kB − balloon 3.842.512 kB = 4.282.388 kB còn lại cho hệ thống; trong đó MemAvailable 3.063.852 kB + free/cache ~1,19 GB. Lúc cuối cửa sổ 01:34:32Z: tổng RAM − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 550.720 kB.

### 2.3 Median tickCost lượt yên #18 (T4, đợt 142) — HỢP LỆ Ở ATTEMPT3, 49,0 ms

- **T4-142 đã xuất bản LIMITS** (`docs/PHASE9_ROUND142_T4_WEBKIT_QUIET18_LIMITS.md`): lượt yên #18 **HỢP LỆ Ở ATTEMPT3** (20/20 pass, probe_exit=0, lớp B 5/5). **TickCost median 49,0 ms** hậu flip+2000 ms (n=451; tổng n=615 median 47,0 ms) ≤ 60 ms. Chuỗi median 15 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / **49,0 ms** (trung bình 47,9 ms). Ngưỡng ≤60 ms KHÔNG BÀN LẠI.
- Attempt1 và attempt2 đều 20/20 nhưng **lớp B vi phạm (B2) → lượt nhiễm tải, KHÔNG dùng cho verdict** (tiền lệ đợt 128: tối đa 3 attempt). Attempt1: load1_max 5,24; attempt2: load1_max 4,59, 10 mẫu >4 — sampler T9 ghi độc lập load1 4,82 lúc 00:02:26Z trong cửa sổ attempt1/2. Attempt3 chạy 00:17:12–00:21:01Z — đúng đợt xả thứ ba của sampler (2.247,8 MiB lúc 00:21:27Z).
- **Cửa yên mở được nhờ xả balloon đầu vòng 2:** cả **24/24 mẫu sampler trong 00:00–00:23Z đều ≥1024 MiB**; T4 ghi balloon xả −1.427.660 kB (~−1,36 GiB) từ lúc mở (6.443.824 kB) tới lúc đóng (5.016.164 kB lúc 00:23:36Z). Đây là **đợt thứ hai liên tiếp T4 đo được lượt yên nhờ xả thoáng qua** (đợt 141: −2,09 GB; đợt 142: −1,36 GiB theo số T4) — mẫu xả–đo vẫn lặp lại, nhưng xả không bền (xem §2.2).
- Lượt yên tiếp theo (#19) đo ở đợt 143 theo kế hoạch đứng.
- T9 không tự đo tickCost (không thuộc phạm vi T9); số trên lấy từ file T4-142, T10 đối chiếu chéo khi gộp.

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
| **142** | ****~0,45 GB (brief không ghi; T9 đo trực tiếp 464.260 kB lúc ~23:40Z, 495.108 kB lúc 23:41:20Z)**** | ****485–1.149 MiB (boot cũ, 13 mẫu, 23:41:37–23:53:38Z) rồi 530–2.992 MiB (boot mới, 100 mẫu, 23:55:26Z–01:34:32Z); REBOOT 23:54:20Z cắt giữa hai pha; gap lấy mẫu ~1'48"** (sampler dài của T9, ~113 phút)** | ****538 MiB lúc 01:34:32Z (576 MB lúc 01:39:26Z, sau sampler)**** |

## 3. Guard birefnet — KHÔNG ĐẠT (48,70%), KHÔNG CHẠY

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 139 (e) + đợt 140 (f)(g) + đợt 141 (j) GIỮ NGUYÊN quy trình + guard 6.144 MiB): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này (sampler T9, 113 mẫu, hai vòng): **3.063.852 kB = 2.992,0 MiB = 48,70% guard** lúc **00:05:26Z** (boot mới, 11 mẫu ≥2.000.000 kB 00:05:26–00:22:28Z) — thiếu **3.227.604 kB (~3.152,0 MiB, ~51,3%)**.
- Không có mẫu nào trên boot cũ vượt 1.176.808 kB (18,70% guard). **0 mẫu ≥ 6.144 MiB ở bất kỳ vòng nào.** Không có cửa sổ nào để thử. Watcher guard chạy suốt cả hai vòng tới 01:37:27Z — cờ guard-open.flag KHÔNG xuất hiện.
- Đỉnh đợt này (48,70%) cao hơn đợt 141 (46,55%) và đợt 140 (36,49%) và đợt 139 (42,44%) — **đỉnh CAO nhất kể từ đợt 138 (99,07%)**; chuỗi đỉnh các đợt 136→142: 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB, 2.242 MB, 2.860 MB, **2.992 MB**. Nhưng vẫn cách guard hơn một nửa — khác hẳn đợt 138 (thiếu 57 MiB).
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói. Quy trình "thử ngay" đã được trực đúng (T9 ở lại muộn, sampler chạy tới 01:35:32Z, watcher guard chạy suốt cả hai vòng), cửa sổ chỉ không mở.

### 3.1 Sẵn sàng thử đã xác minh lại (23:43Z, chỉ đọc — không chạy)

- Venv: `server/bgremove/.venv/bin/python` tồn tại; `rembg 2.0.87`, `onnxruntime 1.23.2` import được (kiểm lại đợt này, khớp đợt 138/139/140/141).
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử đã chuẩn bị (chưa chạy — không đủ điều kiện guard): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-142-birefnet/out-birefnet-142.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-142-birefnet/` đã tạo sẵn, trống.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (kiểm tra `ps` lúc 23:41Z và lúc ~01:36Z; chỉ có tiến trình hệ thống + các luồng đợt 142; lúc 23:41Z chỉ thấy tiến trình `find ... -name *vite-lock*` của T6 đang kiểm tra lock) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 1.617 chỉ đủ ~1,02 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=1617, i=1617; lần 3 không gặp ENOSPC trong CAP 20.000) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot 22:48:05Z: **0 dòng "No space left" / ENOSPC** (kiểm tra ~01:36Z). `journalctl --list-boots` chỉ hiện boot mới 9afdaa89 (first entry 23:54:31Z) — boot cũ không còn trong journal của cell, như đợt 138/139/140/141.
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 142 = boot lúc T9 đo đầu:** btime **22:48:05Z** 18/11 (`uptime -s` 22:48:05 + `btime 1795042085` trong `/proc/stat` + boot_id `bde599df-eb81-4205-86a0-b71a0ab9790c` + `who -b`: system boot Nov 18 22:48). Đây là boot mới lên sau đợt 141 (đợt 141 đóng trên boot ed5323a4 btime 22:33:03Z theo T2-142). **T2-142: bde599df = #102? TẠM** (ứng viên, btime NẰM NGOÀI dải tạm — lần OUTSIDE đầu tiên kể từ #93?; chuỗi INSIDE đứt tại #102?).
- **REBOOT GIỮA CỬA SỔ ĐO CỦA T9: boot mới 9afdaa89, btime 23:54:20Z** (`uptime -s` 23:54:20 + `btime 1795046060` + boot_id `9afdaa89-6721-4afa-aade-0358fe38e527` + `who -b`: system boot Nov 18 23:54 + journal first entry 23:54:31Z). Boot cũ sống 22:48:05Z → 23:54:20Z = **1h06m15s**. **T2-142: 9afdaa89 = ứng viên #103? TẠM**; T2 gọi đây là **reboot #27**, T4-142 gọi **reboot #26** — chênh số đếm giữa hai luồng, giao T10 chốt.
- **Khung chết boot cũ:** mốc cuối chắc chắn còn sống trên boot cũ theo dữ liệu T9 là mẫu sampler 23:53:38Z (746.488 kB) → khung **(23:53:38Z, 23:54:20Z] (42 s)**. Gộp với T4-142 (poll #16 lúc 23:53:55Z trên boot cũ) → khung chặt hơn **(23:53:55Z, 23:54:20Z] (25 s)**. T6/T2 là chủ quản chốt khung chết boot bde599df.
- **Runtime restart đi kèm reboot:** phiên exec sleep chờ của T9 bị SIGTERM giết cùng lúc reboot (~23:54Z); sampler vòng 1 (nohup) cũng bị giết cùng lúc. T9 khởi động lại sampler vòng 2 lúc 23:55:26Z (gap lấy mẫu ~1'48", 23:53:38Z → 23:55:26Z — xem F-142-T9-4). Không mất mẫu nào khác.
- **Dị thường boot_id b47f7932 (xem F-142-T9-2):** lúc 23:54:36Z T9 đọc được boot_id `b47f7932-ebca-4205-86a0-b71a0ab9790c`, `uptime -s` 23:53:38, btime 1795046018 — nhưng btime boot 9afdaa89 là 23:54:20Z (sớm hơn thời điểm đọc 23:54:36Z) và T2/T4 đều ghi bde599df → 9afdaa89 trực tiếp, không có boot trung gian. Đáng chú ý: b47f7932 chia sẻ nhóm 3–5 với bde599df (`4205-86a0-b71a0ab9790c`) và nhóm 2 chỉ khác 2 ký tự (`ebca` so với `eb81`) — UUID ngẫu nhiên độc lập khó trùng 14 ký tự hex như vậy. T9 không khẳng định b47f7932 là boot thật; giao T2/T10 chốt.
- **Replay: 2 dòng lúc T9 mở** (ghi cuối 22:48:39Z `startup packages configure` ×2 — replay chết yểu trên boot bde599df, T2-142 xác nhận độc lập; T5-142 đã trigger repair 23:44:06Z). **Replay trên boot mới: 566 dòng lúc 23:56Z** (ghi cuối 23:56:39Z `status installed fontconfig:amd64 2.15.0-1.1ubuntu2` — replay đang chạy nhanh). **Lúc T9 đóng: 1.545 dòng** (ghi cuối 23:58:47Z `status installed gstreamer1.0-tools:amd64 1.24.2-1.1ubuntu2` — **khác 1.24.2-1ubuntu0.1 của đợt 140/141**). **T5 là chủ quản replay — T9 chỉ ghi nhận số, không kết luận "xong"/"chưa xong".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.
- T7-142 chưa có cờ `.done` lúc T9 kiểm tra lần cuối (01:32Z) — T10 đối chiếu khi gộp.

## 6. Sai số của chính T9 (ghi rõ)

- **F-142-T9-1 — Headroom VẪN DƯỚI ngưỡng báo < ~1.800 (1.617, thấp hơn ngưỡng 183), lần thứ hai liên tiếp:** hai lần đo chính trên boot bde599df đều 1.617 (chênh 0), cùng probe, cùng phương pháp — giá trị là thật, không phải sai số đo. Ngưỡng đã chạm ở đợt 141 và user đã được báo trong báo cáo đợt 141; đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Tỉ lệ/vite chỉ còn ~1,02 lần — sát giới hạn 1 vite nối tiếp.
- **F-142-T9-2 — Dị thường boot_id b47f7932 quan sát được lúc 23:54:36Z:** T9 đọc được boot_id `b47f7932-ebca-4205-86a0-b71a0ab9790c`, `uptime -s` 23:53:38, btime 1795046018 — nhưng (a) btime boot 9afdaa89 là 23:54:20Z, sớm hơn thời điểm đọc 16 giây; (b) T2-142 và T4-142 đều ghi bde599df → 9afdaa89 trực tiếp (khung chết (23:53:55Z, 23:54:20Z]), không có boot trung gian. Hai khả năng: (i) có một boot trung gian b47f7932 sống ~42 s (23:53:38–23:54:20Z) mà T2/T4 không lấy mẫu kịp, và lần đọc của T9 lúc 23:54:36Z đua với reboot; (ii) dị thường đồng hồ/btime, cùng lớp với dị thường lock-log của T6 đợt 141. T9 **không khẳng định** b47f7932 là một boot thật và **không đưa vào chuỗi boot**; giao T2/T10 chốt. Không ảnh hưởng số liệu headroom/RAM (chuỗi lấy trên bde599df; sampler vòng 2 chạy trên 9afdaa89 đã xác minh bằng boot_id + btime + journal).
- **F-142-T9-3 — Cửa sổ thoáng headroom >20.000 ngay sau boot XUẤT HIỆN TRỞ LẠI ở boot 9afdaa89:** đo lần 3 lúc boot ~50 giây tuổi thêm 20.000 watch không gặp ENOSPC, khác đợt 141 (lần 3 lúc boot 68 giây tuổi đã dừng ở 1.719) và giống đợt 140 (lần 3 lúc boot 80 giây tuổi thêm 20.000 watch không gặp ENOSPC). Ba lần đo dùng cùng phương pháp — chênh lệch là thật, không phải sai số đo. T9 ghi nhận là **quan sát**, không kết luận cơ chế (tiến trình giữ watch ngoài cell đăng ký lại chậm hơn sau reboot lần này, hoặc cửa sổ thoáng không tồn tại trên boot đợt 141 — ngoài tầm xác minh của cell). Giá trị chuỗi vẫn lấy 1.617; >20.000 không đưa vào chuỗi.
- **F-142-T9-4 — Khoảng trống lấy mẫu do reboot (~1'48") + sampler vòng 1 bị SIGTERM giết cùng lúc reboot:** khoảng trống 23:53:38Z → 23:55:26Z không có mẫu (vòng 2 khởi động lại 23:55:26Z). Watcher guard vòng 1 cũng bị SIGTERM giết cùng lúc (~23:54Z). Một lần vượt guard ngắn hơn 108 giây nằm trong khoảng trống này có thể không được quan sát — nhưng khoảng cách tới guard rất lớn (thiếu ~3.152,0 MiB lúc đỉnh) nên khả năng vượt lén là không đáng kể. (Cùng lớp F-141-T9-4.)
- **F-142-T9-5 — Khoảng trống lấy mẫu 60 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "Không quan sát được ≥ 6.144 MiB" (kết luận §3) nghĩa đúng là **không có mẫu nào ≥ guard**, không phải chứng minh tuyệt đối "không lúc nào vượt". Đợt này khoảng cách tới guard rất lớn nên khả năng vượt lén là không đáng kể — khác đợt 138 (thiếu 57 MiB). (Cùng lớp F-141-T9-5.)
- **F-142-T9-6 — Đính chính số học tạm trong báo cáo giữa lượt của T9:** tuổi boot lúc đo lần 3 là **~50 giây** (btime 9afdaa89 23:54:20Z, đo 23:55:10Z), không phải ~92 giây (đã tính nhầm theo btime b47f7932 23:53:38Z trước khi phát hiện dị thường F-142-T9-2). Giá trị đo (>20.000) không đổi; chỉ sửa tuổi boot.
- **F-142-T9-7 — Nhãn "end=22:28Z" sót trong dòng SAMPLER START của script vòng 2:** text cũ từ `sed` (dòng echo giữ nguyên), END thực tế là 01:35:00Z 19/11 và SAMPLER END 01:35:32Z xác nhận — chỉ là nhãn hiển thị, không ảnh hưởng dữ liệu hay thời gian chạy.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 143 (phần T9)

1. **⚠️ Headroom VẪN DƯỚI < ~1.800 (1.617, thấp hơn ngưỡng 183) — lần thứ hai liên tiếp dưới ngưỡng** (user đã được báo ở đợt 141; đợt này không báo riêng). Tốc độ giảm mười ba đợt gần nhất ~101–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng sâu hơn (chỉ là phép chia số học — KHÔNG phải dự báo). Tỉ lệ/vite chỉ còn ~1,02 lần. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell.
2. **Guard birefnet giữ nguyên 6.144 MiB** (quyết parent đợt 136 §12.3(f) + đợt 138 §12.3(d) + đợt 139 (e) + đợt 140 (f)(g) + đợt 141 (j)) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Đỉnh đợt này 48,70% guard (thiếu ~3.152,0 MiB) — cao nhất kể từ đợt 138 nhưng vẫn cách guard hơn một nửa; **giữ quy trình T9 ở lại muộn + sampler dài ở đợt sau**.
3. **Balloon đóng băng 6.443.824 kB trong 37/113 mẫu (32,7% cửa sổ)** — **đợt thứ năm liên tiếp** ở đúng giá trị này; quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" chưa thấy hiệu quả ở đợt 139/140/141/142 (chỉ xả răng cưa đầu vòng 2 rồi đóng băng trở lại); nếu đợt 143 vẫn ~500–600 MB thì parent/T10 mới xem có can thiệp host được không (T4 không tự ý hạ ngưỡng gate A). Quyết parent đợt 139: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB.
4. **Reboot giữa lượt 23:54:20Z, khung (23:53:38Z, 23:54:20Z] (42 s, theo dữ liệu T9) / (23:53:55Z, 23:54:20Z] (25 s, gộp với T4)** — khung chết boot bde599df + số boot mới 9afdaa89 (#103? TẠM theo T2) chờ T2/T10 chốt; **dị thường boot_id b47f7932** (F-142-T9-2) chờ T2/T10 chốt; số reboot #26 (T4) vs #27 (T2) chờ T10 chốt; replay boot mới 1.545 dòng, gói cuối gstreamer1.0-tools **1.24.2-1.1ubuntu2** (khác 1ubuntu0.1 đợt 140/141) — giao T5 đợt 142/143 đối chiếu. **Reboot KHÔNG reset chuỗi headroom:** cửa sổ thoáng >20.000 chỉ tồn tại ~1 phút đầu sau boot (xem §1.4, F-142-T9-3).
5. **Median tickCost lượt yên #18 (T4) ĐÃ ĐO ĐƯỢC ở đợt 142: 49,0 ms, HỢP LỆ (attempt3)** — lượt yên tiếp theo (#19) đo ở đợt 143 theo kế hoạch đứng; ngưỡng ≤60 ms giữ.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 141 §11: mù #61 (T2 — đoạn B mở, tối đa 1 ẩn), G1 chờ user quyết, R9 (a) số đếm 16, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND142_T9_HEADROOM_LIMITS.md` (file này) — **VƯỢT ngưỡng push thường 37.768 byte** (~47 kB, do Phụ lục A+B: bảng sampler đầy đủ 113 mẫu theo yêu cầu brief — không cắt dữ liệu cần thiết) — push cần `ENABLE_PRIVSEP=0` (như các file oversize đợt 138/139/140/141). Kích thước/md5 chính xác lấy trên đĩa lúc T10 gộp.
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round142-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round142-t9/headroom-measure-1.log` (đo lần 1), `headroom-measure-2.log` (đo lần 2), `headroom-measure-3-postreboot.log` (đo lần 3, boot mới), `ram-sampler-long.log` (vòng 1: 13 mẫu, 23:41:37–23:53:38Z), `ram-sampler-long-2.log` (vòng 2: 100 mẫu, 23:55:26Z–01:34:32Z), `ram-sampler-long.sh` + `ram-sampler-long-2.sh` (script hai vòng), `guard-watcher.sh` + `guard-watcher-2.sh` (watcher hai vòng), `appendix-vong1.md` + `appendix-vong2.md` (bảng sampler đã sinh), `guard-watcher.out` + `guard-watcher-2.out` (log watcher) — không nằm trong repo nên không stage.
- Cờ `round142-t9.done` đã tạo khi xong.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard).

## Phụ lục A. Bảng sampler đầy đủ — vòng 1 (13 mẫu, 60 s/mẫu, boot bde599df)

Nguồn: `hidden_files/round142-t9/ram-sampler-long.log` (23:41:37–23:53:38Z, bị SIGTERM giết cùng lúc reboot 23:54:20Z). Guard = 6.291.456 kB.
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 1 | 23:41:37Z | 496396 | 484.8 | 6443824 | 638472 | 0.63 | **← min**
| 2 | 23:42:37Z | 774132 | 756.0 | 6087484 | 652692 | 1.22 |
| 3 | 23:43:37Z | 1176808 | 1149.2 | 5731036 | 640316 | 1.81 | **← max**
| 4 | 23:44:37Z | 977056 | 954.2 | 5868424 | 636008 | 1.69 |
| 5 | 23:45:37Z | 866136 | 845.8 | 5992612 | 642664 | 1.07 |
| 6 | 23:46:38Z | 803572 | 784.7 | 6106752 | 630728 | 0.75 |
| 7 | 23:47:38Z | 699128 | 682.7 | 6214376 | 626616 | 0.59 |
| 8 | 23:48:38Z | 656724 | 641.3 | 6312300 | 765988 | 0.79 |
| 9 | 23:49:38Z | 538440 | 525.8 | 6404308 | 762804 | 1.06 |
| 10 | 23:50:38Z | 522308 | 510.1 | 6443824 | 724644 | 1.07 |
| 11 | 23:51:38Z | 766164 | 748.2 | 6214592 | 692492 | 1.29 |
| 12 | 23:52:38Z | 846740 | 826.9 | 6086092 | 692524 | 0.90 |
| 13 | 23:53:38Z | 746488 | 729.0 | 6188984 | 687128 | 0.43 |

## Phụ lục B. Bảng sampler đầy đủ — vòng 2 (100 mẫu, 60 s/mẫu, boot 9afdaa89)

Nguồn: `hidden_files/round142-t9/ram-sampler-long-2.log` (23:55:26Z–01:34:32Z, SAMPLER-2 END 01:35:32Z). Số thứ tự nối tiếp vòng 1 (#14–#113). Guard = 6.291.456 kB.
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 14 | 23:55:26Z | 1799332 | 1757.2 | 5018952 | 1020804 | 2.66 |
| 15 | 23:56:26Z | 1656200 | 1617.4 | 5202324 | 915384 | 2.26 |
| 16 | 23:57:26Z | 1688532 | 1649.0 | 5127960 | 846508 | 3.10 |
| 17 | 23:58:26Z | 1597584 | 1560.1 | 5321464 | 825076 | 2.47 |
| 18 | 23:59:26Z | 1430168 | 1396.6 | 5502844 | 818796 | 1.63 |
| 19 | 00:00:26Z | 1257460 | 1228.0 | 5669412 | 816180 | 1.07 |
| 20 | 00:01:26Z | 1166460 | 1139.1 | 4784256 | 734884 | 3.36 |
| 21 | 00:02:26Z | 1459996 | 1425.8 | 4924548 | 730300 | 4.82 |
| 22 | 00:03:26Z | 1430324 | 1396.8 | 5101896 | 735432 | 1.77 |
| 23 | 00:04:26Z | 1190040 | 1162.1 | 5284304 | 735032 | 0.87 |
| 24 | 00:05:26Z | 3063852 | 2992.0 | 3842512 | 733092 | 0.79 | **← max**
| 25 | 00:06:26Z | 2743752 | 2679.4 | 4161892 | 733840 | 0.29 |
| 26 | 00:07:26Z | 2455036 | 2397.5 | 4451720 | 734024 | 0.18 |
| 27 | 00:08:27Z | 2178740 | 2127.7 | 4711580 | 731176 | 1.06 |
| 28 | 00:09:27Z | 1941180 | 1895.7 | 4933524 | 731568 | 1.20 |
| 29 | 00:10:27Z | 1409904 | 1376.9 | 4614736 | 715480 | 2.81 |
| 30 | 00:11:27Z | 1162560 | 1135.3 | 4765748 | 703388 | 3.79 |
| 31 | 00:12:27Z | 2055208 | 2007.0 | 4573500 | 705896 | 2.11 |
| 32 | 00:13:27Z | 2007584 | 1960.5 | 4783264 | 707668 | 1.70 |
| 33 | 00:14:27Z | 2936572 | 2867.7 | 3908124 | 705460 | 1.52 |
| 34 | 00:15:27Z | 2676924 | 2614.2 | 4225388 | 708700 | 0.77 |
| 35 | 00:16:27Z | 2435032 | 2378.0 | 4509280 | 714304 | 0.32 |
| 36 | 00:17:27Z | 1682368 | 1642.9 | 4485340 | 707348 | 1.12 |
| 37 | 00:18:27Z | 1323980 | 1292.9 | 4593972 | 695748 | 1.65 |
| 38 | 00:19:27Z | 1739608 | 1698.8 | 4787420 | 696980 | 0.67 |
| 39 | 00:20:27Z | 1642792 | 1604.3 | 4983424 | 701712 | 1.12 |
| 40 | 00:21:27Z | 2301724 | 2247.8 | 4554864 | 695932 | 1.28 |
| 41 | 00:22:28Z | 2042924 | 1995.0 | 4784328 | 696768 | 0.60 |
| 42 | 00:23:28Z | 1846152 | 1802.9 | 5016164 | 696844 | 0.29 |
| 43 | 00:24:28Z | 1662920 | 1623.9 | 5225048 | 698128 | 0.78 |
| 44 | 00:25:28Z | 1480860 | 1446.2 | 5413496 | 707448 | 0.68 |
| 45 | 00:26:28Z | 1319004 | 1288.1 | 5585380 | 708616 | 0.53 |
| 46 | 00:27:28Z | 1151944 | 1124.9 | 5737852 | 708820 | 0.28 |
| 47 | 00:28:28Z | 1054976 | 1030.2 | 5881328 | 708872 | 0.16 |
| 48 | 00:29:28Z | 890412 | 869.5 | 6008252 | 708640 | 0.20 |
| 49 | 00:30:28Z | 1349096 | 1317.5 | 5589148 | 677600 | 0.28 |
| 50 | 00:31:28Z | 995296 | 972.0 | 5258004 | 669904 | 0.75 |
| 51 | 00:32:28Z | 888352 | 867.5 | 5403144 | 664784 | 1.75 |
| 52 | 00:33:28Z | 1009268 | 985.6 | 5245896 | 645308 | 2.65 |
| 53 | 00:34:28Z | 1773744 | 1732.2 | 5174552 | 637724 | 1.73 |
| 54 | 00:35:28Z | 961128 | 938.6 | 5311536 | 627392 | 1.92 |
| 55 | 00:36:28Z | 943812 | 921.7 | 5437528 | 631012 | 1.66 |
| 56 | 00:37:29Z | 822936 | 803.6 | 5558476 | 632736 | 0.93 |
| 57 | 00:38:29Z | 1194720 | 1166.7 | 5687344 | 633088 | 0.51 |
| 58 | 00:39:29Z | 722604 | 705.7 | 5409816 | 614392 | 0.98 |
| 59 | 00:40:29Z | 905404 | 884.2 | 5270016 | 605056 | 1.15 |
| 60 | 00:41:29Z | 608504 | 594.2 | 5341112 | 609764 | 1.94 |
| 61 | 00:42:29Z | 1376896 | 1344.6 | 5468088 | 623480 | 1.38 |
| 62 | 00:43:29Z | 886904 | 866.1 | 5060164 | 623148 | 2.23 |
| 63 | 00:44:29Z | 919108 | 897.6 | 5206540 | 624164 | 1.48 |
| 64 | 00:45:29Z | 835964 | 816.4 | 5356648 | 625668 | 0.59 |
| 65 | 00:46:29Z | 1417396 | 1384.2 | 5507688 | 627688 | 0.33 |
| 66 | 00:47:29Z | 1209828 | 1181.5 | 5670792 | 631664 | 0.16 |
| 67 | 00:48:29Z | 1076532 | 1051.3 | 5818776 | 631684 | 0.35 |
| 68 | 00:49:29Z | 989156 | 966.0 | 5955560 | 620552 | 0.90 |
| 69 | 00:50:30Z | 1112808 | 1086.7 | 5785120 | 618360 | 0.91 |
| 70 | 00:51:30Z | 1003004 | 979.5 | 5921236 | 620588 | 0.38 |
| 71 | 00:52:30Z | 881476 | 860.8 | 6046780 | 621312 | 0.27 |
| 72 | 00:53:30Z | 778532 | 760.3 | 6160476 | 626044 | 0.18 |
| 73 | 00:54:30Z | 694828 | 678.5 | 6265384 | 629760 | 0.11 |
| 74 | 00:55:30Z | 656320 | 640.9 | 6368452 | 750004 | 0.27 |
| 75 | 00:56:30Z | 586192 | 572.5 | 6443824 | 751320 | 0.14 |
| 76 | 00:57:30Z | 555816 | 542.8 | 6443824 | 751440 | 0.05 |
| 77 | 00:58:30Z | 564676 | 551.4 | 6443824 | 751692 | 0.11 |
| 78 | 00:59:30Z | 552288 | 539.3 | 6443824 | 751972 | 0.19 |
| 79 | 01:00:30Z | 548816 | 536.0 | 6443824 | 758276 | 0.12 |
| 80 | 01:01:30Z | 555380 | 542.4 | 6443824 | 757532 | 0.08 |
| 81 | 01:02:30Z | 563860 | 550.6 | 6443824 | 753336 | 0.03 |
| 82 | 01:03:30Z | 542380 | 529.7 | 6443824 | 753376 | 0.01 | **← min**
| 83 | 01:04:30Z | 555228 | 542.2 | 6443824 | 753400 | 0.00 |
| 84 | 01:05:30Z | 594240 | 580.3 | 6443824 | 722476 | 0.58 |
| 85 | 01:06:30Z | 958364 | 935.9 | 6050608 | 680956 | 0.87 |
| 86 | 01:07:31Z | 871328 | 850.9 | 6172084 | 681464 | 0.39 |
| 87 | 01:08:31Z | 742792 | 725.4 | 6284260 | 681052 | 0.14 |
| 88 | 01:09:31Z | 657988 | 642.6 | 6384500 | 678328 | 0.08 |
| 89 | 01:10:31Z | 580844 | 567.2 | 6443824 | 676392 | 0.18 |
| 90 | 01:11:31Z | 582208 | 568.6 | 6443824 | 677072 | 0.11 |
| 91 | 01:12:31Z | 581512 | 567.9 | 6443824 | 676976 | 0.24 |
| 92 | 01:13:31Z | 588600 | 574.8 | 6443824 | 678100 | 0.09 |
| 93 | 01:14:31Z | 576452 | 562.9 | 6443824 | 677980 | 0.03 |
| 94 | 01:15:31Z | 582164 | 568.5 | 6443824 | 679308 | 0.11 |
| 95 | 01:16:31Z | 584064 | 570.4 | 6443824 | 680136 | 0.04 |
| 96 | 01:17:31Z | 579844 | 566.3 | 6443824 | 680248 | 0.01 |
| 97 | 01:18:31Z | 566028 | 552.8 | 6443824 | 680308 | 0.10 |
| 98 | 01:19:31Z | 573668 | 560.2 | 6443824 | 680448 | 0.04 |
| 99 | 01:20:31Z | 566816 | 553.5 | 6443824 | 680736 | 0.06 |
| 100 | 01:21:31Z | 595512 | 581.6 | 6443824 | 674948 | 0.42 |
| 101 | 01:22:31Z | 609292 | 595.0 | 6443824 | 664244 | 0.59 |
| 102 | 01:23:32Z | 605140 | 591.0 | 6443824 | 662284 | 0.25 |
| 103 | 01:24:32Z | 611516 | 597.2 | 6443824 | 660416 | 0.09 |
| 104 | 01:25:32Z | 575512 | 562.0 | 6443824 | 669920 | 0.13 |
| 105 | 01:26:32Z | 580888 | 567.3 | 6443824 | 670620 | 0.05 |
| 106 | 01:27:32Z | 567652 | 554.3 | 6443824 | 672352 | 0.02 |
| 107 | 01:28:32Z | 577176 | 563.6 | 6443824 | 672716 | 0.00 |
| 108 | 01:29:32Z | 557236 | 544.2 | 6443824 | 672556 | 0.00 |
| 109 | 01:30:32Z | 572452 | 559.0 | 6443824 | 672688 | 0.04 |
| 110 | 01:31:32Z | 579184 | 565.6 | 6443824 | 672400 | 0.01 |
| 111 | 01:32:32Z | 558488 | 545.4 | 6443824 | 676536 | 0.00 |
| 112 | 01:33:32Z | 563228 | 550.0 | 6443824 | 677348 | 0.00 |
| 113 | 01:34:32Z | 550720 | 537.8 | 6443824 | 677500 | 0.07 |
