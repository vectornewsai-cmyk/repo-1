# LIMITS — Phase 9 đợt 141, T9: headroom inotify + RAM + guard birefnet (CHẠM NGƯỠNG <1.800; REBOOT GIỮA LƯỢT, SAMPLER KHỞI ĐỘNG LẠI)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 1.739** (đo 2 lần trên boot 2c0efe57 btime **19:54:12Z**: 1.739 lúc 20:40:21Z và **1.739** lúc 20:40:29Z 18/11, chênh **0**) — **GIẢM TIẾP**: 1.840 (đợt 140) → **1.739 (−101, −5,5%)**. Xem §1.
- **⚠️ ĐÃ CHẠM NGƯỠNG BÁO USER (< ~1.800) — thấp hơn ngưỡng 61.** Đây là mốc kích hoạt theo quyết parent đợt 139/140: **T10/parent BÁO USER lúc gộp đợt 141.** Vẫn gấp ~1,10 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi — quyết đổi (nếu có) thuộc về parent/user, T9 không tự đổi.** Xem §1.3, F-141-T9-1.
- **Đo lần 3 sau reboot (boot mới 57a0dd12, 21:53:29Z, boot 68 giây tuổi): 1.719** — thấp hơn thêm 20 so với giá trị chuỗi; lần đầu giá trị ổn định sau reboot KHÔNG bằng giá trị trước reboot (đợt 139 chênh 9; đợt 140 chênh 0). Cửa sổ thoáng >20.000 ngay sau boot (đợt 140) **KHÔNG xuất hiện** lần này. Xem §1.4, F-141-T9-2, F-141-T9-3.
- **RAM:** đỉnh 46,55% guard — cao nhất kể từ đợt 138. Max toàn cửa sổ (107 mẫu, hai vòng): **2.928.692 kB = 2.860,1 MiB lúc 20:46:48Z** (boot 2c0efe57), thiếu **3.362.764 kB (~3.284,9 MiB)** mới tới guard 6.291.456 kB. Min toàn cửa sổ: **302.324 kB (295,2 MiB) lúc 21:03:49Z — thấp kỷ lục mới của chuỗi T9**. **0 mẫu ≥ 6.144 MiB. Birefnet KHÔNG THỬ.** Xem §2.
- **Balloon virtio:** ĐÓNG BĂNG ở 6.443.824 kB (79,3% tổng RAM) trong **40/107 mẫu (37,4%)** — vòng 1: 16 mẫu thành 2 đợt (7 + 9); vòng 2: 24 mẫu thành **1 đợt liên tục 22:04:24–22:27:25Z tới hết cửa sổ**. Giá trị đóng băng y hệt đợt 138/139/140 — **đợt thứ tư liên tiếp**; balloon KHÔNG xả bền. Xem §2.2.
- **REBOOT GIỮA CỬA SỔ ĐO: boot 2c0efe57 chết, boot mới 57a0dd12 lên thay, btime 21:52:21Z.** Sampler vòng 1 bị SIGTERM giết cùng lúc (72 mẫu, 20:40:47–21:51:52Z); khởi động lại vòng 2 lúc 21:53:23Z (gap lấy mẫu ~1'31"). Khung chết boot cũ (theo dữ liệu T9): **(21:51:52Z, 21:52:21Z] (29 s)**. Xem §5.
- **Median tickCost lượt yên #17 (T4, đo lại ở đợt 141): 47,0 ms** (attempt1, 20/20 pass, n=431; tổng n=594 median 48,0 ms) ≤ 60 ms — **HỢP LỆ**. Chuỗi 14 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 ms (trung bình 47,7 ms). Xem §2.3.
- Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào (journal 0 dòng "No space left"/ENOSPC từ btime 19:54:12Z). Replay dpkg 1.545 dòng lúc T9 mở (ghi cuối 19:58:09Z, cùng gói cuối như đợt 140); trên boot mới log reset về 2 dòng rồi về lại 1.545 dòng lúc 22:08:12Z. T5 là chủ quản replay.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard — xem §3). Làm việc nhẹ (chỉ đo + sampler).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 141 (boot 2c0efe57, btime 19:54:12Z — boot lúc mở đợt)

| Thời điểm (UTC 18/11) | Headroom | Bối cảnh |
|---|---|---|
| 20:40:21Z | **1.739** | lần đo 1, boot ~46' tuổi; RAM trước đo 403.376 kB, balloon 6.443.824 kB (đóng băng) |
| 20:40:29Z | **1.739** | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 978.516 kB, balloon 5.854.000 kB |

- Probe dừng ở `i=1739` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh 0 trong cùng boot:** lần thứ tư liên tiếp chuỗi T9 ghi chênh 0 ở cả hai lần đo chính (đợt 138, 139, 140 cũng 0). Giá trị đợt lấy **1.739**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 1.739 = **62.008 watch** (tăng ~101 so với 61.907 đợt 140).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 1.739 / 1.578 ≈ **1,10 lần** — đủ cho ~1 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.
- Lưu ý: RAM trước đo lần 1 chỉ 403.376 kB (balloon đóng băng 6.443.824 kB); 8 giây sau, trước đo lần 2, RAM đã 978.516 kB (balloon xả tạm về 5.854.000 kB) — nhưng headroom **không đổi** (1.739 = 1.739): headroom không đi theo RAM khả dụng trong cell, mà theo watch ngoài cell.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–140 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **141** | **1.739 → 1.739** | **đo 20:40:21Z → 20:40:29Z, boot 2c0efe57 btime 19:54:12Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 1.739 = **−2.699 (−60,8%)**. Bước giảm đợt này: −101 so với đợt 140 (−5,5%) — **đợt thứ mười hai liên tiếp bước giảm nằm trong dải 101–127** (130: −116; 131: −117; 132: −108; 133: −106; 134: −127; 135: −110; 136: −114; 137: −106; 138: −111; 139: −110; 140: −114; 141: −101).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: ĐÃ CHẠM — 1.739, thấp hơn ngưỡng 61.** Quyết parent đợt 139: "NẾU đợt 141 chạm <1.800 thì báo user lúc đó" — điều kiện đã thỏa. **T10/parent báo user khi gộp đợt 141.** T9 không tự báo user, không tự đổi quyết theo dõi — chỉ ghi rõ mốc đã chạm và chuyển cờ.
- Trần 63.747 vẫn đầy ở mức ~62,0k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

### 1.4 Đo lần 3 — boot mới 57a0dd12 (ngoài chuỗi, chỉ để đối chiếu)

- **Lần 3, 21:53:29Z (boot 68 giây tuổi): STOP ở `i=1719`, errno=28** — headroom trên boot mới = **1.719**, thấp hơn **20** so với giá trị chuỗi 1.739. RAM trước đo 1.918.768 kB, balloon 4.974.116 kB, SwapFree 1.040.580 kB (swap gần trống sau reboot). File tạm đã dọn sạch.
- **Hai điểm khác đợt 140:** (a) đợt 140 đo lần 3 lúc boot 80 giây tuổi thêm 20.000 watch KHÔNG gặp ENOSPC (cửa sổ thoáng >20.000); đợt này lúc boot 68 giây tuổi đã dừng ở 1.719 — **cửa sổ thoáng sau boot KHÔNG xuất hiện** (xem F-141-T9-2). (b) đợt 140 giá trị ổn định sau reboot bằng đúng trước reboot (1.840 = 1.840, chênh 0); đợt này thấp hơn 20 (xem F-141-T9-3).
- **Không đưa 1.719 vào chuỗi §1.3** — chuỗi lấy giá trị ổn định trên boot lúc mở đợt (1.739, đo 2 lần chênh 0). Giá trị 1.719 chỉ là quan sát đối chiếu sau reboot.
- Hệ quả thực hành: **reboot KHÔNG reset chuỗi suy giảm headroom** — giá trị sau reboot (1.719) còn thấp hơn trước reboot (1.739). Ngưỡng ~1.800 đã chạm; với đà ~101–127/đợt, các đợt sau sẽ đi sâu hơn dưới ngưỡng nếu không can thiệp host (chỉ là phép chia số học minh họa — KHÔNG phải dự báo).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler dài 107 mẫu, 20:40:47–22:27:25Z

### 2.1 Hình dạng cửa sổ: nhô sớm rồi kẹt ~0,5 GB, hai vòng bị reboot cắt

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **Vòng 1: 20:40:47–21:51:52Z, 72 mẫu, boot 2c0efe57 — bị SIGTERM giết cùng lúc reboot 21:52:21Z. Vòng 2: 21:53:23–22:27:25Z, 35 mẫu, boot mới 57a0dd12 — chạy tới hết hạn 22:28Z.** Tổng **107 mẫu** (xem bảng đầy đủ ở Phụ lục A + B). **Min toàn cửa sổ: 302.324 kB (295,2 MiB) lúc 21:03:49Z (boot cũ). Max toàn cửa sổ: 2.928.692 kB (2.860,1 MiB) lúc 20:46:48Z (boot cũ).** Mean vòng 1 ~884.210 kB; mean vòng 2 ~786.608 kB (trộn hai boot — chỉ để tham khảo, không dùng làm chỉ số).

**Boot 2c0efe57 (72 mẫu, 20:40:47–21:51:52Z) — nhô sớm 4 mẫu rồi kẹt thấp, balloon đóng băng trở lại:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 20:40:47Z | 1.758,7 MiB (1.800.944 kB) | mẫu đầu (balloon 5.067.568 kB) |
| 20:46:48Z | **2.860,1 MiB (2.928.692 kB)** | **MAX cửa sổ, 46,55% guard** (balloon min cửa sổ 4.020.972 kB) |
| 20:47:48–20:49:48Z | 2.683,4 → 2.092,7 MiB | 3 mẫu còn ≥2.000.000 kB rồi rơi |
| 20:50:48–21:02:49Z | ~1,9 GB → ~0,5 GB | rơi đơn điệu sau đỉnh |
| 21:03:49Z | **295,2 MiB (302.324 kB)** | **MIN cửa sổ — thấp kỷ lục mới của chuỗi T9** (balloon 6.169.108 kB) |
| 21:04:49–21:29:51Z | ~0,3–1,0 GB | dao động thấp, không đợt hồi nào bền |
| 21:30:51–21:36:52Z | 477,7–510,6 MiB | **vùng trũng 1**: balloon đóng băng 6.443.824 kB (7 mẫu) |
| 21:37:52–21:42:52Z | 478,0–~0,6 GB | nhô ngắn rồi lùi |
| 21:43:52–21:51:52Z | 512,8–555,8 MiB | **vùng trũng 2**: balloon đóng băng suốt 9 mẫu tới lúc reboot cắt |

- Sau đỉnh 20:46:48Z, **không mẫu nào trên boot cũ vượt 1.800.944 kB** (mẫu đầu). Đỉnh chỉ tồn tại 4 mẫu (20:46:48–20:49:48Z) rồi rơi đơn điệu — không đợt hồi nào bền.
- Load1 trong cửa sổ vòng 1: 0,00–2,95 — máy gần như yên trong phần lớn nửa sau (nhiều mẫu load1 0,00–0,21) mà RAM vẫn kẹt ~0,5 GB: RAM thấp không phải do tải trong cell, mà do balloon host giữ.
- Swap: SwapFree 638.956 kB lúc mẫu đầu → 612.208 kB lúc mẫu cuối vòng 1 (swap đang dùng ~410 MB).

**Boot mới 57a0dd12 (35 mẫu, 21:53:23–22:27:25Z) — nhô 1 mẫu đầu rồi kẹt, balloon đóng băng suốt:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 21:53:23Z | **1.890,8 MiB (1.936.172 kB)** | **MAX vòng 2, 30,77% guard** — mẫu đầu sau reboot (balloon 4.974.116 kB; SwapFree 1.040.580 kB — swap gần trống) |
| 21:54:23–22:03:24Z | 1.890,8 → ~0,6 GB | rơi đơn điệu sau đỉnh |
| 22:04:24–22:27:25Z | 563,8–649,5 MiB | **balloon đóng băng 6.443.824 kB suốt 24 mẫu liên tục tới hết cửa sổ** |
| 22:06:24Z | **563,8 MiB (577.296 kB)** | **MIN vòng 2** |

- Sau mẫu đầu, **không mẫu nào trên boot mới vượt 1.936.172 kB**. Không có lần nhô nào đáng kể sau đỉnh — RAM phẳng ~0,6 GB suốt 24 phút cuối.
- Swap: SwapFree 1.040.580 kB (mẫu đầu vòng 2) → 663.848 kB lúc cuối (swap đang dùng ~385 MB sau ~35 phút).

### 2.2 Balloon virtio — xả nông đầu mỗi boot rồi đóng băng y hệt đợt 138/139/140

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Boot cũ: 5.067.568 kB (20:40:47Z) → **min 4.020.972 kB lúc 20:46:48Z (49,5% tổng RAM, đúng lúc đỉnh RAM)** → phình lại **6.443.824 kB (79,3% tổng RAM)** rồi **ĐÓNG BĂNG đúng giá trị này qua 16 mẫu** (2 đợt: 21:30:51–21:36:52Z 7 mẫu; 21:43:52–21:51:52Z 9 mẫu).
- Boot mới: 4.974.116 kB (21:53:23Z) → phình lại **6.443.824 kB** rồi **ĐÓNG BĂNG đúng giá trị này qua 24 mẫu liên tục** (22:04:24–22:27:25Z, tới hết cửa sổ). Chỉ ~11 phút sau boot, balloon đã đóng băng trở lại.
- Tổng: balloon đóng băng 6.443.824 kB trong **40/107 mẫu (37,4% cửa sổ)**. Giá trị 6.443.824 kB lặp lại y hệt qua **bốn đợt (138 + 139 + 140 + 141)** và năm boot — dấu hiệu host giữ balloon ở một mức trần cố định — T9 chỉ ghi nhận, không kết luận cơ chế host.
- Ròng cả cửa sổ (mẫu đầu 20:40:47Z → mẫu cuối 22:27:25Z): balloon 5.067.568 kB → 6.443.824 kB = **+1.376.256 kB (~+1,31 GB)**. Lúc đóng (22:30:33Z, sau sampler): balloon vẫn đóng băng 6.443.824 kB, RAM 564.312 kB.
- **Quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" — đợt 141 VẪN KHÔNG thấy xả bền:** balloon đóng băng 6.443.824 kB trong 40/107 mẫu và RAM phẳng ~0,5–0,6 GB suốt nửa sau mỗi vòng. Đây là **đợt thứ tư liên tiếp** balloon đóng băng ở đúng giá trị này. Quyết parent đợt 139 đã ghi: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB. T9 không đề xuất đổi ngưỡng gate A (quyết đứng), chỉ ghi rõ dữ kiện để parent/T10 cân nhắc ở đợt 142.
- Số học lúc đỉnh RAM 20:46:48Z: tổng RAM 8.124.900 kB − balloon 4.020.972 kB = 4.103.928 kB còn lại cho hệ thống; trong đó MemAvailable 2.928.692 kB + free/cache ~1,17 GB. Lúc cuối cửa sổ 22:27:25Z: tổng RAM − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 606.620 kB.

### 2.3 Median tickCost lượt yên #17 (T4, đo lại ở đợt 141) — HỢP LỆ, 47,0 ms

- **T4-141 đã xuất bản LIMITS** (`docs/PHASE9_ROUND141_T4_WEBKIT_QUIET17_LIMITS.md`): lượt yên #17 **HỢP LỆ — ĐO ĐƯỢC Ở ATTEMPT1** (20/20 pass, probe_exit=0). **TickCost median 47,0 ms** hậu flip+2000 ms (n=431; tổng n=594 median 48,0 ms) ≤ 60 ms. Chuỗi median 14 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / **47,0 ms** (trung bình 47,7 ms). Ngưỡng ≤60 ms KHÔNG BÀN LẠI.
- Lượt #17 này là lượt đo lại sau khi đợt 140 KHÔNG ĐO ĐƯỢC (gate A 0/96 poll ≥1024 MB) — nợ mở đợt 140 §7.5 nay **ĐÃ ĐÓNG**: #17 hợp lệ ở đợt 141. Lượt yên tiếp theo (#18) đo ở đợt 142 theo kế hoạch đứng.
- T9 không tự đo tickCost (không thuộc phạm vi T9); số trên lấy từ file T4-141, T10 đối chiếu chéo khi gộp.

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
| **141** | ****~0,39 GB (brief không ghi; T9 đo trực tiếp 403.376 kB lúc 20:40:21Z, 978.516 kB lúc 20:40:29Z)**** | ****295–2.860 MiB (boot cũ, 72 mẫu, 20:40:47–21:51:52Z) rồi 564–1.891 MiB (boot mới, 35 mẫu, 21:53:23–22:27:25Z); REBOOT 21:52:21Z cắt giữa hai pha; gap lấy mẫu ~1'31"** (sampler dài của T9, ~107 phút)** | ****592 MiB lúc 22:27:25Z (551 MB lúc 22:30:33Z, sau sampler)**** |

## 3. Guard birefnet — KHÔNG ĐẠT (46,55%), KHÔNG CHẠY

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 139 (e) + đợt 140 (f)(g) GIỮ NGUYÊN quy trình + guard 6.144 MiB): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này (sampler T9, 107 mẫu, hai vòng): **2.928.692 kB = 2.860,1 MiB = 46,55% guard** lúc **20:46:48Z** (boot cũ, 4 mẫu ≥2.000.000 kB 20:46:48–20:49:48Z) — thiếu **3.362.764 kB (~3.284,9 MiB, ~53,4%)**.
- Không có mẫu nào trên boot mới vượt 1.936.172 kB (30,77% guard). **0 mẫu ≥ 6.144 MiB ở bất kỳ vòng nào.** Không có cửa sổ nào để thử.
- Đỉnh đợt này (46,55%) cao hơn đợt 140 (36,49%) và đợt 139 (42,44%) — **đỉnh CAO nhất kể từ đợt 138 (99,07%)**; chuỗi đỉnh các đợt 136→141: 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB, 2.242 MB, **2.860 MB**. Nhưng vẫn cách guard hơn một nửa — khác hẳn đợt 138 (thiếu 57 MiB).
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói. Quy trình "thử ngay" đã được trực đúng (T9 ở lại muộn, sampler chạy tới 22:28:25Z, watcher guard chạy suốt cả hai vòng — cờ guard-open.flag KHÔNG xuất hiện), cửa sổ chỉ không mở.

### 3.1 Sẵn sàng thử đã xác minh lại (20:41Z, chỉ đọc — không chạy)

- Venv: `server/bgremove/.venv/bin/python` tồn tại; `rembg 2.0.87`, `onnxruntime 1.23.2` import được (kiểm lại đợt này, khớp đợt 138/139/140).
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử đã chuẩn bị (chưa chạy — không đủ điều kiện guard): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-141-birefnet/out-birefnet-141.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-141-birefnet/` đã tạo sẵn, trống.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (kiểm tra `ps` lúc 20:40Z và lúc 22:30Z; chỉ có tiến trình hệ thống + các luồng đợt 141) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 1.739 chỉ đủ ~1 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=1739, i=1739, i=1719) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot 19:54:12Z: **0 dòng "No space left" / ENOSPC** (kiểm tra 20:41Z và 22:30Z). `journalctl --list-boots` chỉ hiện boot mới 57a0dd12 (first entry 21:52:33Z) — boot cũ không còn trong journal của cell, như đợt 138/139/140.
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 141 = boot lúc T9 đo đầu:** btime **19:54:12Z** 18/11 (`uptime -s` 19:54:12 + `btime 1795031652` trong `/proc/stat` + boot_id `2c0efe57-5559-4e92-9f8b-aecf1f9866a3` + `who -b`: system boot Nov 18 19:54). Đây là boot mới lên sau đợt 140 (đợt 140 đóng trên boot 90392aa5 btime 17:52:56Z). Số boot mới chờ T2 đợt 141 / T10 chốt (nối tiếp #98? tạm của T8-140).
- **REBOOT GIỮA CỬA SỔ ĐO CỦA T9: boot mới 57a0dd12, btime 21:52:21Z** (`uptime -s` 21:52:21 + `btime 1795038741` + boot_id `57a0dd12-c76b-4889-8c87-cc068173ffb1` + `who -b`: system boot Nov 18 21:52 + journal first entry 21:52:33Z). Boot cũ sống 19:54:12Z → 21:52:21Z = **1h58m09s**. Số boot mới chờ T2 đợt 141 / T10 chốt.
- **Khung chết boot cũ:** mốc cuối chắc chắn còn sống trên boot cũ là mẫu sampler 21:51:52Z (525.064 kB) → khung **(21:51:52Z, 21:52:21Z] (29 s)**. T6/T2 là chủ quản chốt khung chết boot 2c0efe57.
- **Runtime restart đi kèm reboot:** phiên exec watcher guard vòng 1 của T9 bị SIGTERM giết cùng lúc reboot (duration 4.252.504 ms ≈ 70'53", kết thúc ~21:52:22Z); sampler vòng 1 (nohup) cũng bị giết cùng lúc. T9 khởi động lại sampler vòng 2 lúc 21:53:23Z (gap lấy mẫu ~1'31", 21:51:52Z → 21:53:23Z — xem F-141-T9-4). Không mất mẫu nào khác.
- **Replay: 1.545 dòng lúc T9 mở** (ghi cuối 19:58:09Z `status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.1` — cùng gói cuối như lúc T9-140 mở/đóng). **Replay trên boot mới: 2 dòng lúc 21:53Z** (ghi cuối 21:52:53Z `startup packages configure` — replay mới bắt đầu). **Lúc T9 đóng: 1.545 dòng** (ghi cuối 22:08:12Z, cùng gói cuối). **T5 là chủ quản replay — T9 chỉ ghi nhận số, không kết luận "xong"/"chưa xong".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Sai số của chính T9 (ghi rõ)

- **F-141-T9-1 — Headroom CHẠM DƯỚI ngưỡng báo < ~1.800 (1.739, thấp hơn ngưỡng 61):** hai lần đo chính trên boot 2c0efe57 đều 1.739 (chênh 0), cùng probe, cùng phương pháp — giá trị là thật, không phải sai số đo. Đây là mốc kích hoạt báo user theo quyết parent đợt 139/140; T9 chuyển cờ cho T10/parent, không tự báo user, không tự đổi quyết theo dõi.
- **F-141-T9-2 — Cửa sổ thoáng headroom >20.000 ngay sau boot KHÔNG xuất hiện ở boot 57a0dd12:** đo lần 3 lúc boot 68 giây tuổi đã dừng ở i=1719 (ENOSPC), khác đợt 140 (lần 3 lúc boot 80 giây tuổi thêm 20.000 watch không gặp ENOSPC). Hai lần đo dùng cùng phương pháp — chênh lệch là thật, không phải sai số đo. T9 ghi nhận là **quan sát**, không kết luận cơ chế (tiến trình giữ watch ngoài cell đăng ký lại nhanh hơn sau reboot lần này, hoặc cửa sổ thoáng không tồn tại trên boot này — ngoài tầm xác minh của cell).
- **F-141-T9-3 — Giá trị ổn định sau reboot (1.719) thấp hơn 20 so với giá trị chuỗi (1.739):** lần đầu giá trị sau reboot KHÔNG bằng giá trị trước reboot (đợt 139 chênh 9; đợt 140 chênh 0). Có thể do watch churn trong lượt (các luồng đợt 141 đang chạy song song giữa hai lần đo, cách nhau ~1h13') — ghi nhận, không kết luận cơ chế. Giá trị chuỗi vẫn lấy 1.739 (đo 2 lần chênh 0 trên boot lúc mở đợt); 1.719 không đưa vào chuỗi.
- **F-141-T9-4 — Khoảng trống lấy mẫu do reboot (~1'31") + sampler vòng 1 bị SIGTERM giết cùng lúc reboot:** khoảng trống 21:51:52Z → 21:53:23Z không có mẫu (vòng 2 khởi động lại 21:53:23Z). Watcher guard vòng 1 cũng bị SIGTERM giết cùng lúc (~21:52:22Z). Một lần vượt guard ngắn hơn 91 giây nằm trong khoảng trống này có thể không được quan sát — nhưng khoảng cách tới guard rất lớn (thiếu 3.284,9 MiB lúc đỉnh) nên khả năng vượt lén là không đáng kể. (Cùng lớp F-140-T9-3.)
- **F-141-T9-5 — Khoảng trống lấy mẫu 60 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "Không quan sát được ≥ 6.144 MiB" (kết luận §3) nghĩa đúng là **không có mẫu nào ≥ guard**, không phải chứng minh tuyệt đối "không lúc nào vượt". Đợt này khoảng cách tới guard rất lớn nên khả năng vượt lén là không đáng kể — khác đợt 138 (thiếu 57 MiB). (Cùng lớp F-140-T9-4.)
- **F-141-T9-6 — RAM min toàn cửa sổ 295,2 MiB (21:03:49Z) — thấp kỷ lục mới của chuỗi T9:** thấp hơn min đợt 140 (463,1 MiB) tới ~168 MiB. Mẫu này load1 0,11 (máy gần như yên) — RAM thấp không phải do tải trong cell. T9 ghi nhận, không kết luận cơ chế (balloon host giữ — xem §2.2).
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 142 (phần T9)

1. **⚠️ Headroom ĐÃ CHẠM < ~1.800 (1.739, thấp hơn ngưỡng 61) — T10/parent BÁO USER khi gộp đợt 141** (mốc kích hoạt theo quyết parent đợt 139/140). Tốc độ giảm mười hai đợt gần nhất ~101–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng sâu hơn (chỉ là phép chia số học — KHÔNG phải dự báo). Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell.
2. **Guard birefnet giữ nguyên 6.144 MiB** (quyết parent đợt 136 §12.3(f) + đợt 138 §12.3(d) + đợt 139 (e) + đợt 140 (f)(g)) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Đỉnh đợt này 46,55% guard (thiếu 3.284,9 MiB) — cao nhất kể từ đợt 138 nhưng vẫn cách guard hơn một nửa; **giữ quy trình T9 ở lại muộn + sampler dài ở đợt sau**.
3. **Balloon đóng băng 6.443.824 kB trong 40/107 mẫu (37,4% cửa sổ)** — **đợt thứ tư liên tiếp** ở đúng giá trị này; quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" chưa thấy hiệu quả ở đợt 139/140/141; nếu đợt 142 vẫn ~500–600 MB thì parent/T10 mới xem có can thiệp host được không (T4 không tự ý hạ ngưỡng gate A). Quyết parent đợt 139: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB.
4. **Reboot giữa lượt 21:52:21Z, khung (21:51:52Z, 21:52:21Z] (29 s, theo dữ liệu T9)** — khung chết boot 2c0efe57 + số boot mới 57a0dd12 chờ T2 đợt 141 / T10 chốt; replay boot mới 2 dòng lúc 21:53Z → 1.545 dòng lúc 22:08:12Z — giao T5 đợt 141 đối chiếu. **Reboot KHÔNG reset chuỗi headroom:** giá trị sau reboot (1.719) còn thấp hơn trước reboot (1.739) (xem §1.4, F-141-T9-3).
5. **Median tickCost lượt yên #17 (T4) ĐÃ ĐO ĐƯỢC ở đợt 141: 47,0 ms, HỢP LỆ** — nợ mở đợt 140 §7.5 đã đóng. Lượt yên tiếp theo (#18) đo ở đợt 142 theo kế hoạch đứng; ngưỡng ≤60 ms giữ.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 140 §11: mù #60 (T2), G1 chờ user quyết, R9 (a) số đếm 16, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND141_T9_HEADROOM_LIMITS.md` (file này) — **VƯỢT ngưỡng push thường 37.768 byte** (~40,6 kB, do Phụ lục A+B: bảng sampler đầy đủ 107 mẫu theo yêu cầu brief — không cắt dữ liệu cần thiết) — push cần `ENABLE_PRIVSEP=0` (như các file oversize đợt 138/139/140). Kích thước/md5 chính xác lấy trên đĩa lúc T10 gộp.
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round141-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round141-t9/headroom-measure-1.log` (đo lần 1), `headroom-measure-2.log` (đo lần 2), `headroom-measure-3-postreboot.log` (đo lần 3, boot mới), `ram-sampler-long.log` (vòng 1: 72 mẫu, 20:40:47–21:51:52Z), `ram-sampler-long-2.log` (vòng 2: 35 mẫu, 21:53:23–22:27:25Z), `ram-sampler-long.sh` + `ram-sampler-long-2.sh` (script hai vòng), `guard-watcher.sh` + `guard-watcher-2.sh` (watcher hai vòng), `appendix-vong1.md` + `appendix-vong2.md` (bảng sampler đã sinh), `k8-headroom-highcap.py` (script trần cao, dự phòng) — không nằm trong repo nên không stage.
- Cờ `round141-t9.done` đã tạo khi xong.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard).

## Phụ lục A. Bảng sampler đầy đủ — vòng 1 (72 mẫu, 60 s/mẫu, boot 2c0efe57)

Nguồn: `hidden_files/round141-t9/ram-sampler-long.log` (20:40:47–21:51:52Z, bị SIGTERM giết cùng lúc reboot 21:52:21Z). Guard = 6.291.456 kB.
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 1 | 20:40:47Z | 1800944 | 1758.7 | 5067568 | 638956 | 1.41 |
| 2 | 20:41:47Z | 1656760 | 1617.9 | 5198556 | 646916 | 1.86 |
| 3 | 20:42:48Z | 1519204 | 1483.6 | 5375956 | 651740 | 1.64 |
| 4 | 20:43:48Z | 815760 | 796.6 | 5220272 | 638008 | 2.59 |
| 5 | 20:44:48Z | 1153900 | 1126.9 | 5340724 | 632848 | 1.47 |
| 6 | 20:45:48Z | 1151812 | 1124.8 | 5490112 | 635380 | 0.92 |
| 7 | 20:46:48Z | 2928692 | 2860.1 | 4020972 | 612604 | 1.25 | **← max**
| 8 | 20:47:48Z | 2747800 | 2683.4 | 4162756 | 619164 | 0.94 |
| 9 | 20:48:48Z | 2344752 | 2289.8 | 4446840 | 629496 | 0.83 |
| 10 | 20:49:48Z | 2142880 | 2092.7 | 4696776 | 646320 | 1.82 |
| 11 | 20:50:48Z | 1874284 | 1830.4 | 4920148 | 646468 | 0.77 |
| 12 | 20:51:48Z | 1672216 | 1633.0 | 5130596 | 655228 | 0.36 |
| 13 | 20:52:48Z | 1501868 | 1466.7 | 5307032 | 654832 | 0.93 |
| 14 | 20:53:48Z | 1102680 | 1076.8 | 5153272 | 619628 | 0.53 |
| 15 | 20:54:49Z | 1037884 | 1013.6 | 5288928 | 745472 | 1.99 |
| 16 | 20:55:49Z | 1510560 | 1475.2 | 5442464 | 756784 | 1.23 |
| 17 | 20:56:49Z | 754472 | 736.8 | 5558496 | 746948 | 1.19 |
| 18 | 20:57:49Z | 779180 | 760.9 | 5667188 | 739208 | 0.79 |
| 19 | 20:58:49Z | 665748 | 650.1 | 5772932 | 727856 | 0.40 |
| 20 | 20:59:49Z | 545484 | 532.7 | 5863352 | 708604 | 0.71 |
| 21 | 21:00:49Z | 477484 | 466.3 | 5946216 | 688148 | 0.51 |
| 22 | 21:01:49Z | 447416 | 436.9 | 6025544 | 682936 | 0.19 |
| 23 | 21:02:49Z | 365676 | 357.1 | 6098860 | 676056 | 0.19 |
| 24 | 21:03:49Z | 302324 | 295.2 | 6169108 | 635860 | 0.11 | **← min**
| 25 | 21:04:49Z | 485056 | 473.7 | 5964292 | 639236 | 0.42 |
| 26 | 21:05:49Z | 682260 | 666.3 | 5795924 | 627568 | 0.94 |
| 27 | 21:06:49Z | 530972 | 518.5 | 5891996 | 627060 | 1.28 |
| 28 | 21:07:49Z | 508892 | 497.0 | 5968724 | 642396 | 0.74 |
| 29 | 21:08:50Z | 411676 | 402.0 | 6046296 | 636876 | 0.30 |
| 30 | 21:09:50Z | 384104 | 375.1 | 6117164 | 633148 | 0.25 |
| 31 | 21:10:50Z | 315768 | 308.4 | 6181396 | 621908 | 0.24 |
| 32 | 21:11:50Z | 463968 | 453.1 | 5692456 | 598424 | 1.73 |
| 33 | 21:12:50Z | 733592 | 716.4 | 5508952 | 601568 | 1.97 |
| 34 | 21:13:50Z | 462284 | 451.4 | 5611520 | 600840 | 2.70 |
| 35 | 21:14:50Z | 831812 | 812.3 | 5303388 | 600048 | 2.50 |
| 36 | 21:15:50Z | 615132 | 600.7 | 5386772 | 602048 | 1.92 |
| 37 | 21:16:50Z | 747200 | 729.7 | 5504072 | 602656 | 1.06 |
| 38 | 21:17:51Z | 662308 | 646.8 | 5630428 | 603904 | 0.44 |
| 39 | 21:18:51Z | 1176380 | 1148.8 | 5759972 | 617188 | 0.26 |
| 40 | 21:19:51Z | 1007340 | 983.7 | 5901740 | 617684 | 0.17 |
| 41 | 21:20:51Z | 927896 | 906.1 | 6031496 | 618620 | 0.27 |
| 42 | 21:21:51Z | 832952 | 813.4 | 6145200 | 609420 | 0.71 |
| 43 | 21:22:51Z | 828360 | 808.9 | 5461536 | 597144 | 1.53 |
| 44 | 21:23:51Z | 1335844 | 1304.5 | 5614428 | 605952 | 1.53 |
| 45 | 21:24:51Z | 1144152 | 1117.3 | 5768788 | 612920 | 0.71 |
| 46 | 21:25:51Z | 1020416 | 996.5 | 5910468 | 619608 | 0.26 |
| 47 | 21:26:51Z | 913044 | 891.6 | 6039720 | 626412 | 0.49 |
| 48 | 21:27:51Z | 783076 | 764.7 | 6154836 | 627552 | 0.26 |
| 49 | 21:28:51Z | 703584 | 687.1 | 6261532 | 626512 | 0.20 |
| 50 | 21:29:51Z | 609596 | 595.3 | 6360360 | 630588 | 0.14 |
| 51 | 21:30:51Z | 522888 | 510.6 | 6443824 | 630876 | 0.05 |
| 52 | 21:31:51Z | 510672 | 498.7 | 6443824 | 631704 | 0.02 |
| 53 | 21:32:51Z | 497968 | 486.3 | 6443824 | 631756 | 0.00 |
| 54 | 21:33:51Z | 516196 | 504.1 | 6443824 | 631808 | 0.00 |
| 55 | 21:34:51Z | 501620 | 489.9 | 6443824 | 632308 | 0.03 |
| 56 | 21:35:51Z | 489128 | 477.7 | 6443824 | 633100 | 0.01 |
| 57 | 21:36:52Z | 489440 | 478.0 | 6443824 | 632636 | 0.04 |
| 58 | 21:37:52Z | 740236 | 722.9 | 6247216 | 602192 | 0.95 |
| 59 | 21:38:52Z | 1014580 | 990.8 | 5901116 | 596576 | 0.58 |
| 60 | 21:39:52Z | 968908 | 946.2 | 6033540 | 597200 | 0.21 |
| 61 | 21:40:52Z | 819860 | 800.6 | 6156572 | 601412 | 0.08 |
| 62 | 21:41:52Z | 725396 | 708.4 | 6265600 | 600316 | 0.03 |
| 63 | 21:42:52Z | 613344 | 599.0 | 6365004 | 605752 | 0.01 |
| 64 | 21:43:52Z | 531512 | 519.1 | 6443824 | 604872 | 0.00 |
| 65 | 21:44:52Z | 569152 | 555.8 | 6443824 | 601784 | 0.19 |
| 66 | 21:45:52Z | 538000 | 525.4 | 6443824 | 602612 | 0.20 |
| 67 | 21:46:52Z | 536660 | 524.1 | 6443824 | 602948 | 0.07 |
| 68 | 21:47:52Z | 531164 | 518.7 | 6443824 | 603496 | 0.08 |
| 69 | 21:48:52Z | 536988 | 524.4 | 6443824 | 603716 | 0.21 |
| 70 | 21:49:52Z | 528508 | 516.1 | 6443824 | 603740 | 0.07 |
| 71 | 21:50:52Z | 538360 | 525.7 | 6443824 | 604760 | 0.11 |
| 72 | 21:51:52Z | 525064 | 512.8 | 6443824 | 612208 | 0.10 |

## Phụ lục B. Bảng sampler đầy đủ — vòng 2 (35 mẫu, 60 s/mẫu, boot 57a0dd12)

Nguồn: `hidden_files/round141-t9/ram-sampler-long-2.log` (21:53:23–22:27:25Z, SAMPLER-2 END 22:28:25Z). Số thứ tự nối tiếp vòng 1 (#73–#107). Guard = 6.291.456 kB.
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 73 | 21:53:23Z | 1936172 | 1890.8 | 4974116 | 1040580 | 2.88 | **← max**
| 74 | 21:54:23Z | 1690576 | 1651.0 | 5189904 | 1039516 | 1.26 |
| 75 | 21:55:23Z | 1571156 | 1534.3 | 5378576 | 900788 | 1.42 |
| 76 | 21:56:23Z | 1387852 | 1355.3 | 5559848 | 848600 | 0.59 |
| 77 | 21:57:23Z | 1204844 | 1176.6 | 5722300 | 846700 | 0.32 |
| 78 | 21:58:23Z | 1087260 | 1061.8 | 5870944 | 825552 | 0.12 |
| 79 | 21:59:23Z | 980972 | 958.0 | 6007764 | 799428 | 0.10 |
| 80 | 22:00:23Z | 855144 | 835.1 | 6132948 | 797220 | 0.16 |
| 81 | 22:01:23Z | 722932 | 706.0 | 6245248 | 792636 | 0.21 |
| 82 | 22:02:23Z | 670752 | 655.0 | 6349216 | 791076 | 0.26 |
| 83 | 22:03:24Z | 584188 | 570.5 | 6442988 | 773668 | 0.13 |
| 84 | 22:04:24Z | 579216 | 565.6 | 6443824 | 760924 | 0.13 |
| 85 | 22:05:24Z | 585224 | 571.5 | 6443824 | 761276 | 0.08 |
| 86 | 22:06:24Z | 577296 | 563.8 | 6443824 | 761468 | 0.18 | **← min**
| 87 | 22:07:24Z | 614756 | 600.3 | 6443824 | 680244 | 1.34 |
| 88 | 22:08:24Z | 665092 | 649.5 | 6443824 | 664568 | 2.95 |
| 89 | 22:09:24Z | 646588 | 631.4 | 6443824 | 665396 | 1.13 |
| 90 | 22:10:24Z | 641620 | 626.6 | 6443824 | 666184 | 0.48 |
| 91 | 22:11:24Z | 680044 | 664.1 | 6443824 | 661416 | 0.92 |
| 92 | 22:12:24Z | 665988 | 650.4 | 6443824 | 655152 | 0.37 |
| 93 | 22:13:24Z | 633628 | 618.8 | 6443824 | 658456 | 0.17 |
| 94 | 22:14:24Z | 630700 | 615.9 | 6443824 | 659804 | 0.06 |
| 95 | 22:15:24Z | 634112 | 619.2 | 6443824 | 659968 | 0.09 |
| 96 | 22:16:24Z | 630796 | 616.0 | 6443824 | 661116 | 0.03 |
| 97 | 22:17:24Z | 610296 | 596.0 | 6443824 | 661192 | 0.07 |
| 98 | 22:18:24Z | 610032 | 595.7 | 6443824 | 661348 | 0.02 |
| 99 | 22:19:24Z | 616064 | 601.6 | 6443824 | 661340 | 0.04 |
| 100 | 22:20:24Z | 611816 | 597.5 | 6443824 | 661500 | 0.01 |
| 101 | 22:21:24Z | 587960 | 574.2 | 6443824 | 661780 | 0.00 |
| 102 | 22:22:25Z | 596080 | 582.1 | 6443824 | 664672 | 0.07 |
| 103 | 22:23:25Z | 615304 | 600.9 | 6443824 | 670532 | 0.10 |
| 104 | 22:24:25Z | 610236 | 595.9 | 6443824 | 670772 | 0.04 |
| 105 | 22:25:25Z | 604572 | 590.4 | 6443824 | 674924 | 0.20 |
| 106 | 22:26:25Z | 585384 | 571.7 | 6443824 | 679492 | 0.60 |
| 107 | 22:27:25Z | 606620 | 592.4 | 6443824 | 663848 | 0.86 |
